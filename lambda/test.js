const { handler } = require("./handler");

const run = async () => {
  const res = await handler({
    directive: {
      header: {
        namespace: "Alexa",
        name: "ReportState",
        payloadVersion: "3",
        messageId: "",
        correlationToken: "",
      },
      endpoint: {
        scope: {
          type: "BearerToken",
          token: "",
        },
        endpointId: "XGIMIBEAMER",
        cookie: {},
      },
      payload: {},
    },
  });

  console.log(res);
};

run();
