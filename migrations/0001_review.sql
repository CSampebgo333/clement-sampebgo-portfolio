CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY,
 repo TEXT,
 path TEXT NOT NULL DEFAULT '',
 relationship TEXT NOT NULL CHECK(relationship IN ('owned','contributed','manual')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','excluded')),
 snapshot TEXT NOT NULL,
 content TEXT,
 featured INTEGER NOT NULL DEFAULT 0,
 public_verified INTEGER NOT NULL DEFAULT 0,
 discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 notified INTEGER NOT NULL DEFAULT 0,
 UNIQUE(repo,path)
);
CREATE TABLE IF NOT EXISTS exclusions (repo TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS projects_public ON projects(status,public_verified);
