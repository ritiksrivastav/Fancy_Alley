const spawn = require("child_process").spawn;

const qrcode = (url) => {
  return new Promise((resolve, reject) => {
    var workerProcess = spawn("python", [
      `${__dirname}/qrcode.py`,
      url,
    ]);
    var result = "";
    workerProcess.stdout.on("data", (data) => {
      result += data;
    });
    workerProcess.on("close", (code) => {
      resolve(result);
    });
    workerProcess.on("error", (err) => {
      reject(err);
    });
  });
};

// (async() => {
//     console.log(await qrcode("ritwick"));
// })()
module.exports = qrcode;
