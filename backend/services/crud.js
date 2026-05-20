// Generic CRUD route factory for governance entities.
// Each entity passes its table name, the columns to expose, and its natural-id field.
const express = require('express');
const pool = require('../config/database');
const { fireWebhooks } = require('./webhooks');
const { addNotification } = require('./notifications');

// Translate certain table writes into webhook events + notifications.
function eventFor(table, op, row) {
  if (table === 'incidents' && op === 'create') {
    return { event: 'incident.opened', title: `Incident opened: ${row.incident_id || row.id}`, body: row.description || row.type || '' };
  }
  if (table === 'evaluations' && (op === 'create' || op === 'update') && row.passed === false) {
    return { event: 'eval.failed', title: `Evaluation failed: ${row.eval_id || row.id}`, body: `${row.model || ''} on ${row.dataset || ''} – ${row.metric || ''}` };
  }
  if (table === 'controls' && (op === 'create' || op === 'update') && (row.status === 'missing' || row.status === 'partial')) {
    return { event: 'control.test.failed', title: `Control test ${row.status}: ${row.control_id || row.id}`, body: row.title || '' };
  }
  if (table === 'redteam_findings' && op === 'create' && (row.severity === 'high' || row.severity === 'critical')) {
    return { event: 'redteam.finding.high', title: `Red-team finding (${row.severity}): ${row.finding_id || row.id}`, body: row.technique || '' };
  }
  return null;
}

function buildCrudRouter({ table, idField, columns }) {
  const router = express.Router();

  // LIST
  router.get('/', async (req, res) => {
    try {
      // Hide BYTEA columns in list output
      const r = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
      const rows = r.rows.map((row) => {
        if (row && row.content && Buffer.isBuffer(row.content)) { const c = { ...row }; delete c.content; return c; }
        return row;
      });
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET ONE
  router.get('/:id', async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // BULK IMPORT (CSV body)
  // Accepts either { csv: "<csv-string>" } JSON body or raw text/csv.
  router.post('/bulk-import', async (req, res) => {
    try {
      let csv = '';
      if (typeof req.body === 'string') csv = req.body;
      else if (req.body && typeof req.body.csv === 'string') csv = req.body.csv;
      else if (req.body && Array.isArray(req.body.rows)) {
        // Pre-parsed rows path
        return doImportRows(req.body.rows);
      }
      if (!csv) return res.status(400).json({ error: 'Provide csv string body or { csv } / { rows }' });

      const rows = parseCsv(csv);
      return doImportRows(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }

    async function doImportRows(rows) {
      let imported = 0;
      const errors = [];
      for (const [i, row] of rows.entries()) {
        try {
          const cols = columns.filter((c) => row[c] !== undefined && row[c] !== '');
          if (!cols.includes(idField)) {
            cols.unshift(idField);
            row[idField] = row[idField] || `${table.toUpperCase().slice(0, 4)}-${Date.now()}-${i}`;
          }
          const placeholders = cols.map((_, j) => `$${j + 1}`).join(',');
          const values = cols.map((c) => coerce(row[c]));
          await pool.query(
            `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          imported++;
        } catch (e) {
          errors.push({ row: i, error: e.message });
        }
      }
      res.json({ imported, total: rows.length, errors });
    }
  });

  // CREATE
  router.post('/', async (req, res) => {
    try {
      const body = req.body || {};
      const cols = columns.filter((c) => body[c] !== undefined);
      // Ensure the natural id is present — auto-generate if missing
      if (!cols.includes(idField)) {
        cols.unshift(idField);
        body[idField] = `${table.toUpperCase().slice(0, 4)}-${Date.now()}`;
      }
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
      const values = cols.map((c) => body[c]);
      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`;
      const r = await pool.query(sql, values);
      const row = r.rows[0];

      const evt = eventFor(table, 'create', row);
      if (evt) {
        addNotification({ kind: evt.event, title: evt.title, body: evt.body, resource: table, resource_id: String(row[idField] || row.id) }).catch(() => {});
        fireWebhooks(evt.event, row).catch(() => {});
      }

      res.status(201).json(row);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // UPDATE
  router.put('/:id', async (req, res) => {
    try {
      const body = req.body || {};
      const cols = columns.filter((c) => body[c] !== undefined);
      if (!cols.length) return res.status(400).json({ error: 'No fields to update' });
      const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
      const values = cols.map((c) => body[c]);
      values.push(req.params.id);
      const sql = `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
      const r = await pool.query(sql, values);
      if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
      const row = r.rows[0];

      const evt = eventFor(table, 'update', row);
      if (evt) {
        addNotification({ kind: evt.event, title: evt.title, body: evt.body, resource: table, resource_id: String(row[idField] || row.id) }).catch(() => {});
        fireWebhooks(evt.event, row).catch(() => {});
      }

      res.json(row);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const r = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted', row: r.rows[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
}

// Tiny CSV parser (no external dependency). Supports quoted fields with commas + escaped quotes.
function parseCsv(text) {
  const rows = [];
  const lines = String(text).replace(/\r\n/g, '\n').split('\n').filter(Boolean);
  if (!lines.length) return rows;
  const headers = splitCsvLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = cells[idx] !== undefined ? cells[idx] : ''; });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') { inQuotes = true; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out;
}

function coerce(v) {
  if (v === undefined || v === null || v === '') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  // Don't coerce numbers — let pg handle text → numeric.
  return v;
}

module.exports = { buildCrudRouter };
