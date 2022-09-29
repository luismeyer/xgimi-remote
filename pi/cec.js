const { execSync } = require("child_process");

const runCommand = (cmd) => {
  try {
    const result = execSync(cmd);

    return result.toString();
  } catch {
    return "";
  }
};

const beamer = "0.0.0.0";

exports.on = async () => {
  const command = `echo 'on ${beamer}' | cec-client -s -d 1`;

  runCommand(command);
};

exports.standby = async () => {
  const command = `echo 'standby ${beamer}' | cec-client -s -d 1`;

  runCommand(command);
};

exports.status = async () => {
  const command = `echo 'pow ${beamer}' | cec-client -s -d 1`;

  const res = runCommand(command);

  return res.includes("power status: on");
};
