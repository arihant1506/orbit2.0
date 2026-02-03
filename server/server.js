
import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = 'mailto:admin@orbit.local';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("CRITICAL: Missing Environment Variables. Check .env file.");
  process.exit(1);
}

// Initialize Supabase with Service Key (Bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize Web Push
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// --- STARTUP CONNECTION TEST ---
const checkConnection = async () => {
    try {
        const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        if (error) {
            console.error('❌ [Supabase] Connection Failed:', error.message);
            console.error('   Hint: Ensure you are using the SERVICE_ROLE key, not the ANON key.');
        } else {
            console.log(`✅ [Supabase] Connected. Monitoring ${count || 0} user profiles.`);
        }
    } catch (e) {
        console.error('❌ [Supabase] Connection Error:', e);
    }
};
checkConnection();

// --- ROUTES ---

app.post('/api/save-subscription', async (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !userId) return res.status(400).json({ error: 'Missing data' });

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, endpoint: subscription.endpoint, keys: subscription.keys }, { onConflict: 'user_id, endpoint' });

    if (error) throw error;
    console.log(`[Server] Subscription saved for: ${userId}`);
    res.status(201).json({ message: 'Saved' });
  } catch (err) {
    console.error('Db Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/send-test', async (req, res) => {
    const { userId } = req.body;
    await sendNotificationToUser(userId, { title: 'Test', message: 'System Operational' });
    res.json({ success: true });
});

// --- NOTIFICATION LOGIC ---

const sendNotificationToUser = async (userId, payload) => {
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs || subs.length === 0) return;

  const notifications = subs.map(sub => {
    return webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload)
    ).then(() => {
        console.log(`   -> Sent: "${payload.title}" to user ${userId.slice(0,5)}...`);
    }).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`   -> Pruning expired subscription: ${sub.id}`);
          supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
        } else {
          console.error('   -> Send Error:', err.statusCode);
        }
    });
  });
  await Promise.all(notifications);
};

const parseTime = (timeStr) => {
  if (!timeStr) return -1;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
  if (!match) return -1;
  let [_, h, m, p] = match;
  let hours = parseInt(h);
  if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + parseInt(m);
};

// --- CRON JOB (Runs Every Minute) ---
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  if (now.getMinutes() % 15 === 0) {
      console.log(`[Clock] Heartbeat: ${now.toLocaleTimeString()} - Checking ${dayName}`);
  }

  const { data: profiles, error } = await supabase.from('user_profiles').select('id, profile_data');

  if (error || !profiles) {
      console.error("Error reading profiles:", error?.message);
      return;
  }

  for (const row of profiles) {
    const userId = row.id;
    const profile = row.profile_data;
    if (!profile) continue;

    const { schedule, academicSchedule, waterConfig, preferences } = profile;
    // Default preferences if missing
    const notifPrefs = preferences?.notifications || { water: true, schedule: true, academic: true };

    // 1. UPCOMING PROTOCOLS (Tasks) - 10 Minutes Before
    if (notifPrefs.schedule && schedule && schedule[dayName]) {
      schedule[dayName].forEach(task => {
        if (task.isCompleted) return;
        
        const timeRange = task.timeRange.split('-')[0].trim();
        const startMin = parseTime(timeRange);
        if (startMin === -1) return;

        const diff = startMin - currentMinutes;

        if (diff === 10) {
          sendNotificationToUser(userId, {
            title: `Protocol Imminent: ${task.title}`,
            message: `${task.category} session begins in 10 minutes. Prepare workspace.`,
            tag: `task-${task.id}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/2098/2098402.png'
          });
        }
      });
    }

    // 2. UPCOMING CLASSES - 15 Minutes Before
    if (notifPrefs.academic && academicSchedule && academicSchedule[dayName]) {
      academicSchedule[dayName].forEach(cls => {
        const startMin = parseTime(cls.startTime);
        if (startMin === -1) return;

        const diff = startMin - currentMinutes;
        
        if (diff === 15) {
          sendNotificationToUser(userId, {
            title: `Academic Alert: ${cls.subject}`,
            message: `Class starts in 15 mins at ${cls.venue}. Transit recommended.`,
            tag: `class-${cls.id}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3665/3665939.png'
          });
        }
      });
    }

    // 3. HYDRATION SLOTS - Exact Time
    if (notifPrefs.water && waterConfig && waterConfig.dailyGoal > 0) {
        const glassSize = 0.5;
        const totalSlotsNeeded = Math.ceil(waterConfig.dailyGoal / glassSize);
        const slots = [];
        
        // Slot 1: Morning
        slots.push({ id: 'water-wake', minutes: 7 * 60 + 30 }); // 7:30 AM

        // Remaining Slots (Distributed 9 AM to 9 PM)
        const remaining = totalSlotsNeeded - 1;
        if (remaining > 0) {
            const startMin = 9 * 60;
            const endMin = 21 * 60;
            const interval = (endMin - startMin) / remaining;
            for (let i = 0; i < remaining; i++) {
                slots.push({ id: `water-${i}`, minutes: Math.floor(startMin + (i * interval)) });
            }
        }

        slots.forEach(slot => {
            const diff = slot.minutes - currentMinutes;
            if (diff === 0) {
                // Safety check for progress array
                const alreadyDrank = waterConfig.progress && waterConfig.progress.includes(slot.id);
                if (!alreadyDrank) {
                    sendNotificationToUser(userId, {
                        title: 'Hydration Required',
                        message: 'Bio-rhythm sync. Intake 500ml now to maintain efficiency.',
                        tag: `water-${slot.id}`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/3105/3105807.png'
                    });
                }
            }
        });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Orbit Push Server running on port ${PORT}`);
});
