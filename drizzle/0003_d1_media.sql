CREATE TABLE attachment_chunks (
 attachment_id TEXT NOT NULL REFERENCES attachments(id),
 seq INTEGER NOT NULL, data TEXT NOT NULL,
 PRIMARY KEY(attachment_id,seq)
);
CREATE TRIGGER attachments_storage_limit BEFORE INSERT ON attachments
WHEN (SELECT COALESCE(SUM(size),0) FROM attachments)+NEW.size > 157286400
BEGIN
 SELECT RAISE(ABORT,'STORAGE_FULL');
END;
