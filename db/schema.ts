import {sqliteTable,text,integer} from "drizzle-orm/sqlite-core";
export const adminSessions=sqliteTable("admin_sessions",{tokenHash:text("token_hash").primaryKey(),expires:integer("expires").notNull()});
export const adminAttempts=sqliteTable("admin_attempts",{key:text("key").primaryKey(),window:integer("window").notNull(),count:integer("count").notNull()});

export const reportOverrides=sqliteTable("report_overrides",{reportId:text("report_id").primaryKey(),status:text("status"),deleted:integer("deleted").notNull().default(0)});
