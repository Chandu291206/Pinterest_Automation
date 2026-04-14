import { getSupabaseServer } from "@/lib/supabase";
import fs from "fs";
import path from "path";

async function applyMigrations() {
  const supabase = getSupabaseServer();

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`Applying migration: ${file}`);

    try {
      const { error } = await supabase.rpc("exec_sql", { sql });
      if (error) {
        console.error(`Error applying ${file}:`, error);
      } else {
        console.log(`Successfully applied ${file}`);
      }
    } catch (error) {
      console.error(`Failed to apply ${file}:`, error);
    }
  }
}

applyMigrations().catch(console.error);