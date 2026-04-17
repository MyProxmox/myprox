import { Router, Request, Response } from 'express';
import { adminMiddleware } from '../middleware/adminAuth';
import { db } from '../config/database';

const router = Router();

// All routes require admin auth
router.use(adminMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// STATS — Overview
// GET /api/v1/admin/stats/overview
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const [totals, newThisWeek, newThisMonth, premium, banned, suspended, servers, activeSessions] =
      await Promise.all([
        db.query('SELECT COUNT(*) as total FROM users WHERE role != $1', ['admin']),
        db.query(
          "SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL '7 days' AND role != $1",
          ['admin']
        ),
        db.query(
          "SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL '30 days' AND role != $1",
          ['admin']
        ),
        db.query("SELECT COUNT(*) as total FROM users WHERE plan = 'premium'"),
        db.query("SELECT COUNT(*) as total FROM users WHERE status = 'banned'"),
        db.query("SELECT COUNT(*) as total FROM users WHERE status = 'suspended'"),
        db.query('SELECT COUNT(*) as total FROM proxmox_servers'),
        db.query(
          "SELECT COUNT(DISTINCT user_id) as total FROM sessions WHERE expires_at > NOW() AND created_at >= NOW() - INTERVAL '30 days'"
        ),
      ]);

    // Previous month signup for growth comparison
    const prevMonth = await db.query(
      `SELECT COUNT(*) as total FROM users
       WHERE created_at >= NOW() - INTERVAL '60 days'
         AND created_at <  NOW() - INTERVAL '30 days'
         AND role != $1`,
      ['admin']
    );

    const currentMonthCount = parseInt(newThisMonth.rows[0].total);
    const prevMonthCount = parseInt(prevMonth.rows[0].total);
    const growthRate =
      prevMonthCount > 0
        ? (((currentMonthCount - prevMonthCount) / prevMonthCount) * 100).toFixed(1)
        : null;

    res.json({
      totalUsers: parseInt(totals.rows[0].total),
      newThisWeek: parseInt(newThisWeek.rows[0].total),
      newThisMonth: currentMonthCount,
      growthRate: growthRate ? parseFloat(growthRate) : null,
      premiumUsers: parseInt(premium.rows[0].total),
      bannedUsers: parseInt(banned.rows[0].total),
      suspendedUsers: parseInt(suspended.rows[0].total),
      totalServers: parseInt(servers.rows[0].total),
      activeUsers30d: parseInt(activeSessions.rows[0].total),
    });
  } catch (err) {
    console.error('[admin] stats/overview error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STATS — Signups over time
// GET /api/v1/admin/stats/signups?period=30d|90d|12m
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats/signups', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || '30d';
    let interval: string, groupBy: string, labelFormat: string;

    if (period === '12m') {
      interval = '12 months';
      groupBy = "DATE_TRUNC('month', created_at)";
      labelFormat = 'YYYY-MM';
    } else if (period === '90d') {
      interval = '90 days';
      groupBy = "DATE_TRUNC('week', created_at)";
      labelFormat = 'YYYY-WW';
    } else {
      interval = '30 days';
      groupBy = "DATE_TRUNC('day', created_at)";
      labelFormat = 'YYYY-MM-DD';
    }

    const result = await db.query(
      `SELECT ${groupBy} as period, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '${interval}'
         AND role != 'admin'
       GROUP BY period
       ORDER BY period ASC`
    );

    res.json(result.rows.map((r) => ({
      period: r.period,
      count: parseInt(r.count),
    })));
  } catch (err) {
    console.error('[admin] stats/signups error:', err);
    res.status(500).json({ error: 'Failed to fetch signup stats' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STATS — Revenue
// GET /api/v1/admin/stats/revenue
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats/revenue', async (_req: Request, res: Response) => {
  try {
    const PREMIUM_PRICE = parseFloat(process.env.PREMIUM_PRICE_EUR || '8');

    const [premiumCount, recentEvents] = await Promise.all([
      db.query("SELECT COUNT(*) as total FROM users WHERE plan = 'premium'"),
      db.query(
        `SELECT event_type, DATE_TRUNC('month', created_at) as month, COUNT(*) as count
         FROM subscription_events
         WHERE created_at >= NOW() - INTERVAL '12 months'
         GROUP BY event_type, month
         ORDER BY month ASC`
      ),
    ]);

    const premium = parseInt(premiumCount.rows[0].total);
    const mrr = premium * PREMIUM_PRICE;

    res.json({
      mrr: mrr.toFixed(2),
      arr: (mrr * 12).toFixed(2),
      premiumUsers: premium,
      pricePerUser: PREMIUM_PRICE,
      events: recentEvents.rows,
    });
  } catch (err) {
    console.error('[admin] stats/revenue error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue stats' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — List (paginated)
// GET /api/v1/admin/users?page=1&limit=20&search=&plan=&status=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const plan = req.query.plan as string;
    const status = req.query.status as string;

    const conditions: string[] = ["u.role != 'admin'"];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`u.email ILIKE $${paramIdx++}`);
      params.push(`%${search}%`);
    }
    if (plan && plan !== 'all') {
      conditions.push(`u.plan = $${paramIdx++}`);
      params.push(plan);
    }
    if (status && status !== 'all') {
      conditions.push(`u.status = $${paramIdx++}`);
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [users, countResult] = await Promise.all([
      db.query(
        `SELECT
          u.id, u.email, u.plan, u.role, u.status,
          u.created_at, u.last_login_at,
          u.suspended_until, u.ban_reason,
          COUNT(DISTINCT ps.id)::int AS servers_count
        FROM users u
        LEFT JOIN proxmox_servers ps ON ps.user_id = u.id
        ${where}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int as total FROM users u ${where}`,
        params
      ),
    ]);

    res.json({
      users: users.rows,
      total: countResult.rows[0].total,
      page,
      pages: Math.ceil(countResult.rows[0].total / limit),
    });
  } catch (err) {
    console.error('[admin] users list error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Single user profile
// GET /api/v1/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [user, servers, events] = await Promise.all([
      db.query(
        `SELECT id, email, plan, role, status, created_at, last_login_at,
                stripe_customer_id, stripe_subscription_id, stripe_period_end,
                suspended_until, ban_reason
         FROM users WHERE id = $1`,
        [id]
      ),
      db.query(
        'SELECT id, name, local_ip, mode, verified, created_at FROM proxmox_servers WHERE user_id = $1 ORDER BY created_at DESC',
        [id]
      ),
      db.query(
        `SELECT ae.event_type, ae.meta, ae.created_at, u.email as actor_email
         FROM app_events ae
         LEFT JOIN users u ON u.id = ae.actor_id
         WHERE ae.user_id = $1
         ORDER BY ae.created_at DESC
         LIMIT 20`,
        [id]
      ),
    ]);

    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({
      ...user.rows[0],
      servers: servers.rows,
      recentEvents: events.rows,
    });
  } catch (err) {
    console.error('[admin] user detail error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Update (plan, role)
// PATCH /api/v1/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan, role } = req.body;

    const updates: string[] = [];
    const params: (string)[] = [];
    let i = 1;

    if (plan) { updates.push(`plan = $${i++}`); params.push(plan); }
    if (role) { updates.push(`role = $${i++}`); params.push(role); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    updates.push(`updated_at = NOW()`);
    params.push(id);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`,
      params
    );

    await logAdminEvent(req.adminId!, id, 'USER_UPDATED', { plan, role });
    res.json({ success: true });
  } catch (err) {
    console.error('[admin] user update error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Suspend
// POST /api/v1/admin/users/:id/suspend
// body: { reason, hours }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/users/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = '', hours = 24 } = req.body;
    const suspendedUntil = new Date(Date.now() + hours * 3600_000);

    await db.query(
      `UPDATE users SET status = 'suspended', suspended_until = $1, ban_reason = $2 WHERE id = $3`,
      [suspendedUntil, reason, id]
    );

    await logAdminEvent(req.adminId!, id, 'USER_SUSPENDED', { reason, hours });
    res.json({ success: true, suspendedUntil });
  } catch (err) {
    console.error('[admin] suspend error:', err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Ban
// POST /api/v1/admin/users/:id/ban
// ─────────────────────────────────────────────────────────────────────────────
router.post('/users/:id/ban', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    await db.query(
      `UPDATE users SET status = 'banned', ban_reason = $1, suspended_until = NULL WHERE id = $2`,
      [reason, id]
    );

    // Invalidate all sessions
    await db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    await logAdminEvent(req.adminId!, id, 'USER_BANNED', { reason });
    res.json({ success: true });
  } catch (err) {
    console.error('[admin] ban error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Restore
// POST /api/v1/admin/users/:id/restore
// ─────────────────────────────────────────────────────────────────────────────
router.post('/users/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE users SET status = 'active', suspended_until = NULL, ban_reason = NULL WHERE id = $1`,
      [id]
    );

    await logAdminEvent(req.adminId!, id, 'USER_RESTORED', {});
    res.json({ success: true });
  } catch (err) {
    console.error('[admin] restore error:', err);
    res.status(500).json({ error: 'Failed to restore user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USERS — Delete
// DELETE /api/v1/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await logAdminEvent(req.adminId!, id, 'USER_DELETED', {});
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[admin] delete error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY — Recent events
// GET /api/v1/admin/events?limit=50&type=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const type = req.query.type as string;

    const params: (string | number)[] = [limit];
    const typeFilter = type ? 'AND ae.event_type = $2' : '';
    if (type) params.push(type);

    const result = await db.query(
      `SELECT ae.id, ae.event_type, ae.meta, ae.created_at,
              u.email as user_email,
              a.email as actor_email
       FROM app_events ae
       LEFT JOIN users u ON u.id = ae.user_id
       LEFT JOIN users a ON a.id = ae.actor_id
       ${typeFilter ? 'WHERE 1=1 ' + typeFilter : ''}
       ORDER BY ae.created_at DESC
       LIMIT $1`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[admin] events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
async function logAdminEvent(actorId: string, userId: string, type: string, meta: object) {
  try {
    await db.query(
      `INSERT INTO app_events (user_id, actor_id, event_type, meta) VALUES ($1, $2, $3, $4)`,
      [userId, actorId, type, JSON.stringify(meta)]
    );
  } catch (e) {
    console.error('[admin] logEvent error:', e);
  }
}

export default router;
