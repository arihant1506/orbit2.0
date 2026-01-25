
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const webpush = require('web-push');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'orbit-secret-key-change-this-in-prod';

// --- CONFIGURATION ---
// Generate these using: npx web-push generate-vapid-keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BM2...PLACEHOLDER'; 
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'PLACEHOLDER';

if (process.env.VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@orbit-tracker.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn("VAPID Keys not set. Push notifications will fail.");
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

// Helper: Verify Token Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Helper: Admin Check Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.username !== 'arihant') {
    return res.status(403).send('Access Denied: Owner Clearance Required');
  }
  next();
};

// --- AUTH ROUTES ---

// 1. REGISTER
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing credentials');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    const userId = userResult.rows[0].id;
    await pool.query('INSERT INTO user_data (user_id, profile_data) VALUES ($1, $2)', [userId, {}]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).send('Username already exists');
    res.status(500).send('Server Error');
  }
});

// 2. LOGIN
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(400).send('User not found');
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(403).send('Invalid password');

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// --- DATA SYNC ROUTES ---

app.get('/sync', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT profile_data FROM user_data WHERE user_id = $1', [req.user.id]);
    res.json(result.rows.length > 0 ? result.rows[0].profile_data : null);
  } catch (err) {
    res.status(500).send('Sync Error');
  }
});

app.post('/sync', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO user_data (user_id, profile_data) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET profile_data = $2, last_synced = CURRENT_TIMESTAMP',
      [req.user.id, req.body]
    );
    res.json({ success: true, timestamp: new Date() });
  } catch (err) {
    res.status(500).send('Save Error');
  }
});

// --- ADMIN ROUTES (NEW) ---

// Get All Users (Admin Only)
app.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.username, u.email, u.created_at, ud.profile_data, ud.last_synced
      FROM users u
      LEFT JOIN user_data ud ON u.id = ud.user_id
      ORDER BY ud.last_synced DESC NULLS LAST
    `);
    
    // Transform data to match frontend UserProfile shape where possible
    const users = result.rows.map(row => {
      const baseProfile = row.profile_data || {};
      return {
        ...baseProfile,
        username: row.username,
        email: row.email || baseProfile.email,
        joinedDate: row.created_at,
        lastSynced: row.last_synced,
        schedule: baseProfile.schedule || {}, // Ensure structure exists
        academicSchedule: baseProfile.academicSchedule || {}
      };
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Admin Fetch Error');
  }
});

// Delete User (Admin Only)
app.delete('/admin/users/:username', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const targetUsername = req.params.username;
    // Prevent suicide (Owner cannot delete self via this route for safety)
    if (targetUsername === 'arihant') return res.status(403).send("Cannot delete System Owner");

    await pool.query('DELETE FROM users WHERE username = $1', [targetUsername]);
    res.json({ success: true, message: `User ${targetUsername} terminated.` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Delete Error');
  }
});

// --- PUSH NOTIFICATION ROUTES ---

// Store Subscription
app.post('/api/subscribe', authenticateToken, async (req, res) => {
  const subscription = req.body;
  try {
    await pool.query('UPDATE users SET push_subscription = $1 WHERE id = $2', [subscription, req.user.id]);
    res.status(201).json({});
  } catch (err) {
    console.error(err);
    res.status(500).send('Subscription failed');
  }
});

// Helper to Send Push
async function sendPushNotification(userId, title, message, type = 'system') {
  try {
    // 1. Get Subscription
    const userRes = await pool.query('SELECT push_subscription FROM users WHERE id = $1', [userId]);
    const subscription = userRes.rows[0]?.push_subscription;
    
    // 2. Save to DB History
    await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)', 
        [userId, title, message, type]
    );

    // 3. Send Web Push
    if (subscription) {
        const payload = JSON.stringify({ title, message, type });
        await webpush.sendNotification(subscription, payload);
        console.log(`[PUSH] Sent to user ${userId}: ${title}`);
    }
  } catch (error) {
    console.error(`[PUSH ERROR] User ${userId}:`, error.message);
  }
}

// --- CRON SCHEDULER ---

// Helper: Parse "10:00 AM" to minutes
const parseTime = (str) => {
    if (!str) return -1;
    const match = str.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
    if (!match) return -1;
    let [_, h, m, p] = match;
    let hours = parseInt(h);
    if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + parseInt(m);
};

// 1. Check Classes (Every minute)
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    try {
        const res = await pool.query(`
            SELECT u.id, ud.profile_data 
            FROM users u 
            JOIN user_data ud ON u.id = ud.user_id 
            WHERE u.push_subscription IS NOT NULL
        `);

        for (const row of res.rows) {
            const academic = row.profile_data?.academicSchedule?.[dayName] || [];
            
            academic.forEach(cls => {
                const startMins = parseTime(cls.startTime);
                const diff = startMins - currentMins;

                if (diff === 15) {
                    sendPushNotification(row.id, `Upcoming: ${cls.subject}`, `Class starts in 15 mins at ${cls.venue}`, 'reminder');
                } else if (diff === 5) {
                    sendPushNotification(row.id, `HURRY: ${cls.subject}`, `Class starting in 5 mins!`, 'reminder');
                }
            });
        }
    } catch (e) {
        console.error("Cron Class Error", e);
    }
});

// 2. Hydration Check (Every 2 hours between 8 AM and 10 PM)
// Cron expression: At minute 0 past every 2nd hour from 8 through 22.
cron.schedule('0 8-22/2 * * *', async () => {
    try {
        const res = await pool.query('SELECT id FROM users WHERE push_subscription IS NOT NULL');
        for (const row of res.rows) {
            sendPushNotification(row.id, 'Hydration Check', 'Time to refill. Take a break and drink water.', 'water');
        }
    } catch (e) { console.error("Cron Water Error", e); }
});

// 3. Daily Progress Report (Every day at 8:00 PM)
cron.schedule('0 20 * * *', async () => {
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    try {
        const res = await pool.query(`
            SELECT u.id, ud.profile_data 
            FROM users u 
            JOIN user_data ud ON u.id = ud.user_id 
            WHERE u.push_subscription IS NOT NULL
        `);

        for (const row of res.rows) {
            const schedule = row.profile_data?.schedule?.[dayName] || [];
            if (schedule.length > 0) {
                const completed = schedule.filter(s => s.isCompleted).length;
                const percent = Math.round((completed / schedule.length) * 100);
                
                let msg = `You completed ${percent}% of your goals.`;
                if (percent > 80) msg = `Excellent! ${percent}% completion. Keep the momentum.`;
                else if (percent < 50) msg = `${percent}% complete. Prepare for tomorrow.`;

                sendPushNotification(row.id, 'Daily Report', msg, 'success');
            }
        }
    } catch (e) { console.error("Cron Report Error", e); }
});

app.listen(PORT, () => {
  console.log(`Orbit Backend running on port ${PORT}`);
});
