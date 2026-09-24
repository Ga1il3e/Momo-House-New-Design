import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { isHouse } from "../lib/house";

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const email = arg("email");
const role = arg("role");
const house = arg("house");
const name = arg("name") ?? "";

if (!email || (role !== "staff" && role !== "owner")) {
  console.error(
    'Usage: npx tsx --env-file=.env.local scripts/create-staff.ts --email … --role staff|owner [--house montmartre|poissonniere] --name "…"',
  );
  process.exit(1);
}

if (role === "owner" && house) {
  console.error("Owner accounts must not have --house.");
  process.exit(1);
}
if (role === "staff" && !isHouse(house)) {
  console.error("Staff accounts require --house montmartre|poissonniere.");
  process.exit(1);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}.`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_SECRET_KEY");

async function main() {
  const admin = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const password = randomBytes(12).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: role === "owner" ? { role } : { role, house },
  });
  if (error || !data.user) {
    console.error(error?.message ?? "createUser failed");
    process.exit(1);
  }

  const { error: insertError } = await admin.from("staff_members").insert({
    user_id: data.user.id,
    role,
    house: role === "staff" ? house : null,
    display_name: name || null,
  });
  if (insertError) {
    console.error(insertError.message);
    process.exit(1);
  }

  console.log(`Created ${role} ${email}`);
  console.log(`One-time password: ${password}`);
  console.log("Store this password, then change it via /admin/mot-de-passe.");
}

void main();
