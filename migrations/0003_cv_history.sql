CREATE TABLE IF NOT EXISTS cv_versions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 language TEXT NOT NULL CHECK(language IN ('en','fr')),
 media_id TEXT NOT NULL REFERENCES media(id),
 source_url TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(language,source_url)
);
CREATE INDEX IF NOT EXISTS cv_versions_language_id ON cv_versions(language,id DESC);
