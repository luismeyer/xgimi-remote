const https = require("https");

const URL = process.env.PI_URL;

const log = (message, message1, message2) => {
  console.log(message + message1 + message2);
};

const fetchPi = (url) => {
  console.log("Endpoint: " + url);

  let body = "";

  return new Promise((res, rej) => {
    https.get(url, (response) => {
      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("error", rej);

      response.on("end", () => {
        const data = JSON.parse(body);
        res(data);
      });
    });
  });
};

const handleDiscovery = (request, context) => {
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

  const header = request.directive.header;
  header.name = "Discover.Response";

  log(
    "DEBUG:",
    "Discovery Response: ",
    JSON.stringify({ header: header, payload: payload })
  );

  context.succeed({ event: { header: header, payload: payload } });
};

const handleReportState = (request, context) => {
  fetchPi(`${URL}/status`)
    .catch((e) => console.log("fetch status ", e))
    .then(({ state }) => {
      const powerResult = state ? "ON" : "OFF";

      console.log("received     : " + powerResult);

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
      context.succeed(response);
    });
};

const handlePowerControl = (request, context) => {
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
    fetchPi(`${URL}/on`)
      .catch((e) => console.log("fetch on error", e))
      .then(() => {
        result = "ON";
      });
  }

  if (requestMethod === "TurnOff") {
    fetchPi(`${URL}/on`)
      .catch((e) => console.log("fetch off error", e))
      .then(() => {
        result = "ON";
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
  context.succeed(response);
};

exports.handler = (request, context) => {
  if (
    request.directive.header.namespace === "Alexa.Discovery" &&
    request.directive.header.name === "Discover"
  ) {
    log("DEBUG:", "Discover request", JSON.stringify(request));
    handleDiscovery(request, context, "");

    return;
  }

  if (request.directive.header.namespace === "Alexa.PowerController") {
    if (
      request.directive.header.name === "TurnOn" ||
      request.directive.header.name === "TurnOff"
    ) {
      log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
      handlePowerControl(request, context);

      return;
    }
  }

  if (request.directive.header.namespace === "Alexa") {
    if (request.directive.header.name === "ReportState") {
      log("DEBUG:", "ReportState Request", JSON.stringify(request));
      handleReportState(request, context);

      return;
    }
  }
};
