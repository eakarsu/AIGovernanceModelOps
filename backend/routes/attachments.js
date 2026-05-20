// Minimal multipart/form-data parser + attachments CRUD.
// We avoid external multer dep — implement a tiny parser sufficient for our single-file use case.
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Express raw body parser for multipart uploads
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const delim = Buffer.from(`--${boundary}`);
  let idx = 0;
  while (idx < buffer.length) {
    const start = buffer.indexOf(delim, idx);
    if (start === -1) break;
    const partStart = start + delim.length;
    const end = buffer.indexOf(delim, partStart);
    if (end === -1) break;
    // chunk between two delimiters: skip leading \r\n, drop trailing \r\n
    let chunk = buffer.slice(partStart, end);
    if (chunk.length >= 2 && chunk[0] === 0x0d && chunk[1] === 0x0a) chunk = chunk.slice(2);
    if (chunk.length >= 2 && chunk[chunk.length - 2] === 0x0d && chunk[chunk.length - 1] === 0x0a) chunk = chunk.slice(0, -2);
    // headers and body separated by \r\n\r\n
    const sep = chunk.indexOf(Buffer.from('\r\n\r\n'));
    if (sep === -1) { idx = end; continue; }
    const headerStr = chunk.slice(0, sep).toString('utf8');
    const body = chunk.slice(sep + 4);
    const disp = (headerStr.match(/Content-Disposition:[^\r\n]+/i) || [''])[0];
    const typeHdr = (headerStr.match(/Content-Type:\s*([^\r\n]+)/i) || [null, null])[1];
    const nameMatch = disp.match(/name="([^"]+)"/);
    const fileMatch = disp.match(/filename="([^"]*)"/);
    parts.push({
      name: nameMatch ? nameMatch[1] : null,
      filename: fileMatch ? fileMatch[1] : null,
      mime: typeHdr || (fileMatch ? 'application/octet-stream' : 'text/plain'),
      data: body,
    });
    idx = end;
  }
  return parts;
}

// POST /api/attachments/upload   multipart/form-data: file, resource, resource_id
router.post('/upload', async (req, res) => {
  try {
    const ct = req.headers['content-type'] || '';
    const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!m) return res.status(400).json({ error: 'multipart/form-data with boundary required' });
    const boundary = (m[1] || m[2]).trim();
    const buf = await rawBody(req);
    const parts = parseMultipart(buf, boundary);

    const filePart = parts.find((p) => p.filename);
    const resource = (parts.find((p) => p.name === 'resource') || {}).data?.toString('utf8') || 'generic';
    const resource_id = (parts.find((p) => p.name === 'resource_id') || {}).data?.toString('utf8') || '';
    if (!filePart) return res.status(400).json({ error: 'file part required' });

    const attachment_id = `ATT-${Date.now()}`;
    const r = await pool.query(
      `INSERT INTO attachments (attachment_id, resource, resource_id, filename, mime, size_bytes, content, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, attachment_id, resource, resource_id, filename, mime, size_bytes, uploaded_by, created_at`,
      [attachment_id, resource, resource_id, filePart.filename, filePart.mime, filePart.data.length, filePart.data, req.user?.email || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// List attachments (optional filter by resource + resource_id)
router.get('/', async (req, res) => {
  try {
    const { resource, resource_id } = req.query;
    let sql = `SELECT id, attachment_id, resource, resource_id, filename, mime, size_bytes, uploaded_by, created_at FROM attachments`;
    const conds = [];
    const params = [];
    if (resource) { params.push(resource); conds.push(`resource = $${params.length}`); }
    if (resource_id) { params.push(resource_id); conds.push(`resource_id = $${params.length}`); }
    if (conds.length) sql += ` WHERE ${conds.join(' AND ')}`;
    sql += ` ORDER BY id DESC LIMIT 200`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Download an attachment
router.get('/:id/download', async (req, res) => {
  try {
    const r = await pool.query(`SELECT filename, mime, content FROM attachments WHERE id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    const row = r.rows[0];
    res.setHeader('Content-Type', row.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${row.filename}"`);
    res.send(row.content);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM attachments WHERE id = $1 RETURNING id, attachment_id, filename`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
