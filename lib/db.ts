import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const queryClient = postgres(process.env.SUPABASE_DB_URL!);
export const db = drizzle(queryClient, { schema });
