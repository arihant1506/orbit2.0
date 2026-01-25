-- 1. Users Table: Stores login credentials and basic identity
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    profile_pic_url TEXT,
    push_subscription JSONB, -- stores { endpoint, keys: { p256dh, auth } }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Data Table: Stores the main application state
CREATE TABLE user_data (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    profile_data JSONB NOT NULL,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Settings Table
CREATE TABLE user_settings (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    theme_preference VARCHAR(10) DEFAULT 'system',
    start_of_week VARCHAR(10) DEFAULT 'Monday',
    time_format VARCHAR(10) DEFAULT '12h',
    daily_reminder_enabled BOOLEAN DEFAULT TRUE,
    task_alerts_enabled BOOLEAN DEFAULT TRUE
);

-- 4. Notifications Table (Server-side history)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system', -- 'success', 'reminder', 'water'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_notifications_user ON notifications(user_id);