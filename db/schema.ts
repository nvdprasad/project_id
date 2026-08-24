import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(),
    fullName: text('full_name').notNull(),
    employeeId: text('employee_id').notNull(),
    department: text('department').notNull(),
    roleTitle: text('role_title').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    bloodGroup: text('blood_group'),
    issueDate: text('issue_date').notNull(),
    expiryDate: text('expiry_date').notNull(),
    status: text('status').notNull().default('active'),
    accentColor: text('accent_color').notNull().default('#0f766e'),
    photoKey: text('photo_key'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_cards_status').on(table.status),
    index('idx_cards_department').on(table.department),
    index('idx_cards_created_at').on(table.createdAt),
    index('idx_cards_employee_id').on(table.employeeId),
  ],
);

export type CardRecord = typeof cards.$inferSelect;
export type NewCardRecord = typeof cards.$inferInsert;
