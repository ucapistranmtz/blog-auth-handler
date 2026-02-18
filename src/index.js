const { Client } = require("pg");

exports.handler = async (event) => {
  console.log("Cognito Trigger Event:", JSON.stringify(event, null, 2));

  // Extraemos atributos (Nota: Cognito a veces los manda como strings o null)
  const { sub, email, name } = event.request.userAttributes;

  // Solo email y sub son estrictamente críticos para la identidad
  if (!email || !sub) {
    console.error("Missing critical attributes: email or sub");
    return event;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const query = `
    INSERT INTO "user" (id, email, name, "emailVerified", created_at, updated_at)
    VALUES ($1, $2, $3, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email, 
      name = EXCLUDED.name,
      updated_at = NOW();
    `;

    // Si 'name' no viene, usamos 'Anonymous' o el inicio del email
    const finalName = name || email.split("@")[0] || "Anonymous";

    await client.query(query, [sub, email, finalName]);
    console.log(`Sync completed for user: ${email}`);
  } catch (error) {
    console.error("Database Sync failed:", error);
  } finally {
    await client.end();
  }

  return event;
};
