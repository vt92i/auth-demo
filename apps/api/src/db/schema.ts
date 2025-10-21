import * as t from "drizzle-orm/pg-core";
import { pgTable as table } from "drizzle-orm/pg-core";

export const users = table(
	"users",
	{
		id: t.uuid().defaultRandom().primaryKey(),
		email: t.varchar().notNull(),
		password: t.varchar().notNull(),
	},
	(table) => [t.uniqueIndex("email_idx").on(table.email)],
);

export type User = typeof users.$inferSelect;
