const pool = require('../config/database');

async function addNotification({ user_email = null, kind = 'info', title = '', body = '', resource = null, resource_id = null }) {
  try {
    const r = await pool.query(
      `INSERT INTO notifications (user_email, kind, title, body, resource, resource_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_email, kind, title, body, resource, resource_id]
    );
    return r.rows[0];
  } catch (e) {
    console.error('[notifications.add]', e.message);
    return null;
  }
}

async function listNotifications({ user_email = null, limit = 50 } = {}) {
  const sql = user_email
    ? `SELECT * FROM notifications WHERE user_email = $1 OR user_email IS NULL ORDER BY id DESC LIMIT $2`
    : `SELECT * FROM notifications ORDER BY id DESC LIMIT $1`;
  const params = user_email ? [user_email, limit] : [limit];
  const r = await pool.query(sql, params);
  return r.rows;
}

async function unreadCount({ user_email = null } = {}) {
  const sql = user_email
    ? `SELECT COUNT(*)::int AS n FROM notifications WHERE (user_email = $1 OR user_email IS NULL) AND read_at IS NULL`
    : `SELECT COUNT(*)::int AS n FROM notifications WHERE read_at IS NULL`;
  const params = user_email ? [user_email] : [];
  const r = await pool.query(sql, params);
  return r.rows[0].n;
}

async function markRead(id) {
  const r = await pool.query(`UPDATE notifications SET read_at = NOW() WHERE id = $1 RETURNING *`, [id]);
  return r.rows[0];
}

async function markAllRead(user_email) {
  const sql = user_email
    ? `UPDATE notifications SET read_at = NOW() WHERE (user_email = $1 OR user_email IS NULL) AND read_at IS NULL`
    : `UPDATE notifications SET read_at = NOW() WHERE read_at IS NULL`;
  const params = user_email ? [user_email] : [];
  await pool.query(sql, params);
}

module.exports = { addNotification, listNotifications, unreadCount, markRead, markAllRead };
