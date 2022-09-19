const https = require("https");

const { PI_URL, PASSWORD } = process.env;

if (!PASSWORD || !PI_URL) {
  throw new Error("Missing env");
}

const log = (message, message1, message2) => {
  console.log(message + message1 + message2);
};

const fetchPi = (url) => {
  log("DEBUG: ", "Endpoint: ", url);

  let body = [];

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers: { Authorization: PASSWORD } },
      (response) => {
        response.on("data", (chunk) => {
          log("DEBUG ", "Chunk ", chunk);

          body.push(chunk);
        });

        response.on("error", (error) => {
          log("DEBUG ", "Error ", e);

          reject(error);
        });

        response.on("end", () => {
          log("DEBUG: ", "End fetch ", body);

          try {
            body = JSON.parse(Buffer.concat(body).toString());
            resolve(body);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    request.on("error", (e) => {
      reject(e.message);
    });

    request.end();
  });
};

const handleDiscovery = (request) => {
  const payload = {
    endpoints: [
      {
        endpointId: "XGIMIBEAMER",
        manufacturerName: "XGIMI",
        friendlyName: "Boomer",
        description: "Beamer",
        displayCategories: ["TV"],
        cookie: {},
        capabilities: [
          {
            type: "AlexaInterface",
            interface: "Alexa",
            version: "3",
          },
          {
            interface: "Alexa.PowerController",
            version: "3",
            type: "AlexaInterface",
            properties: {
              supported: [
                {
                  name: "powerState",
                },
              ],
              retrievable: true,
            },
          },
        ],
      },
    ],
  };

  log(
    "DEBUG:",
    "Discovery Response: ",
    JSON.stringify({ header: header, payload: payload })
  );

  return {
    event: {
      header: {
        ...request.directive.header,
        name: "Discover.Response",
      },
      payload: payload,
    },
  };
};

const handleReportState = async (request) => {
  const powerResult = await fetchPi(`${PI_URL}/status`)
    .catch((e) => console.log("fetch status ", e))
    .then(({ state }) => (state ? "ON" : "OFF"));

  log("DEBUG: ", "received: ", powerResult);

  const contextResult = {
    properties: [
      {
        namespace: "Alexa.PowerController",
        name: "powerState",
        value: powerResult,
        timeOfSample: new Date().toISOString(),
        uncertaintyInMilliseconds: 50,
      },
    ],
  };

  const responseHeader = request.directive.header;
  responseHeader.messageId = responseHeader.messageId + "-R";
  responseHeader.name = "StateReport";

  const response = {
    context: contextResult,
    event: {
      header: responseHeader,
      payload: {},
    },
  };

  log("DEBUG:", "ReportState ", JSON.stringify(response));

  return response;
};

const handlePowerControl = async (request) => {
  // get device ID passed in during discovery
  const requestMethod = request.directive.header.name;

  const responseHeader = request.directive.header;
  responseHeader.namespace = "Alexa";
  responseHeader.name = "Response";
  responseHeader.messageId = responseHeader.messageId + "-R";

  // get user token pass in request
  const requestToken = request.directive.endpoint.scope.token;

  let result = "OFF";

  if (requestMethod === "TurnOn") {
    await fetchPi(`${PI_URL}/on`)
      .catch((e) => log("DEBUG: ", "fetch on error", e))
      .then((r) => log("DEBUG: ", "fetch on", r))
      .finally(() => {
        result = "ON";
      });
  }

  if (requestMethod === "TurnOff") {
    await fetchPi(`${PI_URL}/standby`)
      .catch((e) => console.log("fetch off error", e))
      .then((r) => log("DEBUG: ", "fetch off", r))
      .finally(() => {
        result = "OFF";
      });
  }

  const contextResult = {
    properties: [
      {
        namespace: "Alexa.PowerController",
        name: "powerState",
        value: result,
        timeOfSample: new Date().toISOString(),
        uncertaintyInMilliseconds: 50,
      },
    ],
  };

  const response = {
    context: contextResult,
    event: {
      header: responseHeader,
      endpoint: {
        scope: {
          type: "BearerToken",
          token: requestToken,
        },
        endpointId: request.directive.header.message_id,
      },
      payload: {},
    },
  };

  log("DEBUG:", "Alexa.PowerController: ", JSON.stringify(response));

  return response;
};

exports.handler = async (request) => {
  if (
    request.directive.header.namespace === "Alexa.Discovery" &&
    request.directive.header.name === "Discover"
  ) {
    log("DEBUG:", "Discover request", JSON.stringify(request));
    return handleDiscovery(request);
  }

  if (request.directive.header.namespace === "Alexa.PowerController") {
    if (
      request.directive.header.name === "TurnOn" ||
      request.directive.header.name === "TurnOff"
    ) {
      log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
      return handlePowerControl(request);
    }
  }

  if (request.directive.header.namespace === "Alexa") {
    if (request.directive.header.name === "ReportState") {
      log("DEBUG: ", "ReportState Request", JSON.stringify(request));
      return handleReportState(request);
    }
  }
};
