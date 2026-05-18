import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Find all campaigns with the duplicate name pattern
const dupes = await sql`
  SELECT id, name FROM "Campaign"
  WHERE name LIKE '%ASLe3%'
  ORDER BY "createdAt" ASC
`;

console.log(`Found ${dupes.length} duplicate campaigns`);
if (dupes.length === 0) process.exit(0);

// Keep only the first one (has all 162 sends if it was created properly),
// or actually we want to keep none since they all have 1 send each.
// Let's check sends per campaign:
const ids = dupes.map((c) => c.id);
const counts = await sql`
  SELECT "campaignId", COUNT(*) as sends
  FROM "Send" WHERE "campaignId" = ANY(${ids})
  GROUP BY "campaignId"
`;
console.log("Sends per campaign:", counts.slice(0, 5));

// Delete all of them (sends cascade via schema)
const deleted = await sql`DELETE FROM "Campaign" WHERE id = ANY(${ids}) RETURNING id`;
console.log(`Deleted ${deleted.length} campaigns`);
