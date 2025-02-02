import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const todoTable = pgTable("todos", {
  id: serial("id").primaryKey(), // Use `serial` for auto-incrementing IDs
  todo: text("todo").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()),
});