/* global expect */
/* eslint no-console:0 */

const fs = require("node:fs");
const path = require("node:path");

const glob = require("glob");
const looksSame = require("looks-same");

const text2png = require("../index.js");

const platform = {
  darwin: "osx",
  linux: "linux",

  // The following are not tested
  win32: "windows",
  aix: "linux",
  freebsd: "linux",
  openbsd: "linux",
  sunos: "linux"
}[process.platform];

describe("text2png", () => {
  glob
    .sync(path.resolve(__dirname, "testcases", "*.json"))
    .forEach(filePath => {
      const fileName = path.basename(filePath, ".json");
      console.log(fileName);

      it("matches " + fileName, () => {
        const config = JSON.parse(fs.readFileSync(filePath));
        const [, targetPlatform] = fileName.split("_");

        if (targetPlatform && targetPlatform !== platform) {
          return;
        }
        const platformDir = path.resolve('spec', 'generated', platform);
        if (!fs.existsSync(platformDir)) {
          fs.mkdirSync(platformDir, { recursive: true });
        }

        const fullName = fileName.concat('.png');
        const existingBuffer = fs.existsSync(path.resolve(platformDir, fullName))
          ? fs.readFileSync(path.resolve(platformDir, fullName))
          : null;
        const generatedBuffer = existingBuffer || text2png.apply(text2png, config);
        fs.writeFileSync(path.resolve(platformDir, fullName), generatedBuffer);
        const compareBuffer = fs.readFileSync(path.resolve('spec', 'expected', platform, fullName));
        return new Promise((resolve, reject) => {
          looksSame(generatedBuffer, compareBuffer, {  }).then((data) => {
            expect(data.equal).toBe(true);
            resolve();
          }).catch(reject);
        });
      });
    });
});
