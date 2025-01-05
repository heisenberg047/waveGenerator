const fs = require("fs");
const convertVcdToJson = require("./vcdModule/app");
const convertToWaveDrom = require("./vcdModule/wavedrom");
const vcdFile = "dump.vcd";
const outpath = "output.json";
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

const CreateVcdFile = async (req, res) => {
  req.body["files"]?.forEach((element) => {
    fs.writeFile(element.filename, element.content, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return;
      }
      console.log("File created and content written successfully!");
    });
  });

  if (req.body["files"]) {
    let cmd2;
    let cmd1 = await runCmd("iverilog -o fa_sim fa.v fa_tb.v");
    if (cmd1.procced) {
      cmd2 = await runCmd("vvp fa_sim");
    } else {
      res.send({ success: false, message: cmd1.error });
      return;
    }

    if (cmd2.procced) {
      convertVcdToJson(vcdFile, outpath);
      convertToWaveDrom(outpath, "wavedrom.json");

      req.body["files"]?.forEach((element) => {
        let pathname = path.join(__dirname, "", element.filename);
        fs.unlinkSync(pathname);
      });
    } else {
      res.send({ success: false, message: cmd2.error });
    }
  } else {
    res.send({ success: false, message: "Files not sent" });
  }


      const filePath = path.join(__dirname, "", "wavedrom.json");
      res.sendFile(filePath);
};

async function runCmd(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd);

    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return { procced: false, error: stderr };
    }

    console.log(`Output: ${stdout}`);
    return { procced: true, error: "" };
  } catch (error) {
    return { procced: false, error: error.message };
  }
}

module.exports = CreateVcdFile;