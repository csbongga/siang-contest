-- สร้างตารางสำหรับ v1-v2 (เผื่อสร้างใหม่)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS judges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT
);

CREATE TABLE IF NOT EXISTS scores (
  judge_id TEXT NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  c1 INT NOT NULL DEFAULT 0,
  c2 INT NOT NULL DEFAULT 0,
  c3 INT NOT NULL DEFAULT 0,
  c4 INT NOT NULL DEFAULT 0,
  c5 INT NOT NULL DEFAULT 0,
  c6 INT NOT NULL DEFAULT 0,
  c7 INT NOT NULL DEFAULT 0,
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (judge_id, team_id)
);

-- ==========================================
-- โครงสร้าง v3 อัปเดตใหม่
-- ==========================================

-- 1. เพิ่มสถานะการล็อกคะแนนใน scores
ALTER TABLE scores ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE scores ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS edited_by_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS entered_by TEXT NOT NULL DEFAULT 'judge';

-- 2. สร้างตารางบันทึกประวัติการแก้ไข (Audit Log)
CREATE TABLE IF NOT EXISTS score_audit (
  id BIGSERIAL PRIMARY KEY,
  judge_id TEXT,
  team_id TEXT,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON score_audit(created_at DESC);

-- 3. สร้างตารางสำหรับคะแนนโซเชียล (พวงมาลัย, Popular Vote)
CREATE TABLE IF NOT EXISTS social_votes (
  team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  garlands INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. สร้างตารางสถานะระบบ (ล็อกผลรวมก่อนประกาศ)
CREATE TABLE IF NOT EXISTS system_state (
  id INT PRIMARY KEY DEFAULT 1,
  is_finalized BOOLEAN NOT NULL DEFAULT false,
  finalized_at TIMESTAMPTZ,
  CHECK (id = 1)
);
INSERT INTO system_state (id) VALUES (1) ON CONFLICT DO NOTHING;
