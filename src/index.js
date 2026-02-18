const { Client } = require("pg");

exports.handler = async (event) => {
  // Log para ver el evento en CloudWatch
  console.log("Cognito Trigger Event:", JSON.stringify(event, null, 2));

  const { sub, email, name } = event.request.userAttributes;

  if (!email || !sub || !name) {
    console.error("Missing required user attributes: email, sub, name ");
    return event;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const query = `
    INSERT INTO users (id, email, name, created_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;
    `;

    await client.query(query, [sub, email, name || "Anonymous"]);
    console.log(`Sync completed for user: ${email}`);
  } catch (error) {
    console.error("Database Sync failed:", error);
    // No lanzamos error para no bloquear el login del usuario en Cognito
  } finally {
    await client.end();
  }

  return event; // OBLIGATORIO: Cognito necesita el evento de vuelta
};
