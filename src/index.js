const { Client } = require("pg");

exports.handler = async (event) => {
  console.log("Event received", JSON.stringify(event));

  const { userAttributes } = event.request;
  const userEmail = userAttributes.email;
  const userSub = event.userName;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const query = `
            INSERT INTO users (id, email, created_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
        `;

    await client.query(query, [userSub, userEmail]);
    console.log(`User ${userEmail} sync succefully`);
  } catch (error) {
    console.error("DB Error", error);
  } finally {
    await client.end();
  }

  return event;
};
