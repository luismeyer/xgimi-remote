const { exec } = require("child_process");

const runCommand = (cmd) => {
  return new Promise((res, rej) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);

        rej();
        return;
      }

      if (stderr) {
        console.log(`stderr: ${stderr}`);

        rej();
        return;
      }

      console.log(`stdout: ${stdout}`);
      res(stdout);
    });
  });
};

const beamer = "0.0.0.0";

exports.on = async () => {
  const command = `echo 'on ${beamer}' | cec-client -s -d 1`;

  await runCommand(command);
};

exports.standby = async () => {
  const command = `echo 'standby ${beamer}' | cec-client -s -d 1`;

  await runCommand(command);
};

exports.status = async () => {
  const command = `echo 'pow ${beamer}' | cec-client -s -d 1`;

  const res = await runCommand(command).catch(() => "");

  return res.includes("power status: on") === "on";
};
