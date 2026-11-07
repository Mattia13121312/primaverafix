CREATE TABLE reports (
 id TEXT PRIMARY KEY, submission_key TEXT UNIQUE NOT NULL,
 code TEXT NOT NULL, building TEXT NOT NULL, faculty TEXT NOT NULL, site TEXT NOT NULL,
 floor TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
 urgency TEXT NOT NULL, role TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Da prendere in carico',
 published INTEGER NOT NULL DEFAULT 0, deleted INTEGER NOT NULL DEFAULT 0,
 public_note TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 resolved_at INTEGER, first_response_at INTEGER
);
CREATE INDEX reports_public_date ON reports(published, deleted, created_at DESC);
CREATE TABLE attachments (
 id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id),
 object_key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL
);
CREATE INDEX attachments_report ON attachments(report_id);
CREATE TABLE report_votes (
 report_id TEXT NOT NULL REFERENCES reports(id), voter TEXT NOT NULL,
 PRIMARY KEY(report_id,voter)
);
CREATE TABLE request_limits (
 key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL
);
