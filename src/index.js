const { auth } = require("./auth");

exports.handler = async (event) => {
  try {
    // 1. Construimos la URL completa para Better Auth
    const protocol = "https";
    const host = event.requestContext.domainName;
    const path = event.rawPath;
    const query = event.rawQueryString ? `?${event.rawQueryString}` : "";
    const url = `${protocol}://${host}${path}${query}`;

    // 2. Mapeamos el evento de API Gateway a una Request estándar
    const request = new Request(url, {
      method: event.requestContext.http.method,
      headers: new Headers(event.headers),
      body: event.body
        ? event.isBase64Encoded
          ? Buffer.from(event.body, "base64")
          : event.body
        : undefined,
    });

    // 3. Dejamos que Better Auth maneje la lógica y la conexión a Neon
    const response = await auth.handler(request);

    // 4. Retornamos la respuesta en el formato que API Gateway HTTP espera
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  } catch (error) {
    console.error("Error en el Auth Handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
    };
  }
};
