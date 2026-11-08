DROP TRIGGER attachments_storage_limit;
CREATE TRIGGER attachments_storage_limit BEFORE INSERT ON attachments
WHEN (SELECT COALESCE(SUM(size),0) FROM attachments)+NEW.size > 314572800
BEGIN
 SELECT RAISE(ABORT,'STORAGE_FULL');
END;
