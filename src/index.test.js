const { handler } = require("./index");
const { Client } = require("pg");

// Simulamos la librería pg
jest.mock("pg", () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe("Auth Lambda Handler", () => {
  let client;

  beforeEach(() => {
    client = new Client();
    jest.clearAllMocks();
  });

  test("Debe insertar el usuario correctamente en la DB", async () => {
    // 1. Preparamos el evento falso que enviaría Cognito
    const event = {
      userName: "user_123",
      request: {
        userAttributes: {
          email: "test@example.com",
        },
      },
    };

    // 2. Ejecutamos el handler
    const result = await handler(event);

    // 3. Verificamos que se llamó a la DB con los datos correctos
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["user_123", "test@example.com"],
    );
    expect(client.end).toHaveBeenCalledTimes(1);

    // 4. Verificamos que la Lambda retorne el evento (importante para Cognito)
    expect(result).toEqual(event);
  });

  test("Debe capturar errores de DB sin romper el flujo", async () => {
    client.connect.mockRejectedValueOnce(new Error("Connection failed"));

    const event = {
      userName: "user_123",
      request: { userAttributes: { email: "test@example.com" } },
    };

    // No debe lanzar error (throw), debe manejarlo internamente
    const result = await handler(event);

    expect(result).toEqual(event);
  });
});
