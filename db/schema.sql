CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE judges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT
);

CREATE TABLE scores (
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

-- ข้อมูลจำลอง (Seed Data)
INSERT INTO teams (id, name) VALUES 
  ('t1', 'ทีมสาวน้อยเพชรบ้านแพง'),
  ('t2', 'ทีมระเบียบวาทะศิลป์'),
  ('t3', 'ทีมประถมบันเทิงศิลป์')
ON CONFLICT (id) DO NOTHING;

INSERT INTO judges (id, name, pin) VALUES 
  ('j1', 'ครูสลา', '1234'),
  ('j2', 'แม่บานเย็น', '5678'),
  ('j3', 'ครูเต้ย', '9999')
ON CONFLICT (id) DO NOTHING;
