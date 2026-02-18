const { handler } = require("./index");
const { Client } = require("pg");

// 1. Mockeamos el cliente de PostgreSQL
jest.mock("pg", () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe("Cognito Post-Confirmation Lambda - Neon Sync", () => {
  let client;

  beforeEach(() => {
    client = new Client();
    jest.clearAllMocks();
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
  });

  test("Debe insertar el usuario en la tabla 'user' con camelCase", async () => {
    const event = {
      request: {
        userAttributes: {
          sub: "auth0|12345",
          email: "test@example.com",
          name: "John Doe",
        },
      },
    };

    const result = await handler(event);

    // Verificamos que la query use las comillas dobles y el nombre de tabla correcto
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "user"'),
      expect.arrayContaining(["auth0|12345", "test@example.com", "John Doe"]),
    );

    // Verificamos que se envíe el valor de emailVerified como true (implícito en la query)
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('"emailVerified"'),
      expect.anything(),
    );

    expect(result).toEqual(event);
  });

  test("Debe usar un nombre fallback si 'name' viene vacío", async () => {
    const event = {
      request: {
        userAttributes: {
          sub: "user_99",
          email: "no-name@test.com",
          // name no viene
        },
      },
    };

    await handler(event);

    // Verificamos que el tercer parámetro sea el nombre extraído del email o Anonymous
    const queryCalls = client.query.mock.calls[0];
    const params = queryCalls[1];
    expect(params[2]).toBe("no-name"); // email.split('@')[0]
  });

  test("No debe explotar si la base de datos está caída", async () => {
    client.connect.mockRejectedValueOnce(new Error("Neon Connection Timeout"));

    const event = {
      request: {
        userAttributes: { sub: "123", email: "error@test.com" },
      },
    };

    const result = await handler(event);

    // IMPORTANTE: El handler debe retornar el evento para no bloquear Cognito
    expect(result).toEqual(event);
    expect(client.end).toHaveBeenCalled();
  });
});
