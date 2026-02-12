#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const commander = require("commander");

const { version } = require("../package.json");
const text2png = require('../index.js');

commander
  .version(version)
  .description("Create png image from text.")
  .option("-t, --text <message>", "text")
  .option("-o, --output <path>", "output file path")
  .option("-f, --font <string>", 'css font option (e.g. "30px Lobster")')
  .option("-a, --textAlign <textAlign>", "text alignment")
  .option("-c, --color <color>", "text color")
  .option("-b, --backgroundColor <color>", "background color")
  .option("-s, --lineSpacing <number>", "line spacing")

  .option("--strokeWidth <number>", "stroke width")
  .option("--strokeColor <color>", "stroke color")

  .option("--width <number>", "fixed width in pixels")
  .option("--height <number>", "fixed height in pixels")
  .option("--minFontSize <number>", "minimum font size when auto-scaling (default: 8)")
  .option("--verticalAlign <alignment>", "vertical alignment: top, middle, bottom (default: middle)")

  .option(
    "-p, --padding <number>",
    "width of the padding area (left, top, right, bottom)"
  )
  .option("--paddingLeft <number>")
  .option("--paddingTop <number>")
  .option("--paddingRight <number>")
  .option("--paddingBottom <number>")

  .option(
    "--borderWidth <number>",
    "width of border (left, top, right, bottom)"
  )
  .option("--borderLeftWidth <number>")
  .option("--borderTopWidth <number>")
  .option("--borderRightWidth <number>")
  .option("--borderBottomWidth <number>")
  .option("--borderColor <color>", "border color")

  .option(
    "--localFontPath <path>",
    "path to local font (e.g. fonts/Lobster-Regular.ttf)"
  )
  .option("--localFontName <name>", "name of local font (e.g. Lobster)")

  .parse(process.argv);

// Helper function to convert string to number
const toNumber = value => value ? +value : undefined;

// Helper function to build options object from commander
const buildOptions = (commander) => ({
  font: commander.font,
  textAlign: commander.textAlign,
  color: commander.color,
  backgroundColor: commander.backgroundColor,
  lineSpacing: toNumber(commander.lineSpacing),

  strokeWidth: toNumber(commander.strokeWidth),
  strokeColor: commander.strokeColor,

  padding: toNumber(commander.padding),
  paddingLeft: toNumber(commander.paddingLeft),
  paddingTop: toNumber(commander.paddingTop),
  paddingRight: toNumber(commander.paddingRight),
  paddingBottom: toNumber(commander.paddingBottom),

  borderWidth: toNumber(commander.borderWidth),
  borderLeftWidth: toNumber(commander.borderLeftWidth),
  borderTopWidth: toNumber(commander.borderTopWidth),
  borderRightWidth: toNumber(commander.borderRightWidth),
  borderBottomWidth: toNumber(commander.borderBottomWidth),
  borderColor: commander.borderColor,

  localFontPath: commander.localFontPath,
  localFontName: commander.localFontName,

  width: toNumber(commander.width),
  height: toNumber(commander.height),
  minFontSize: toNumber(commander.minFontSize),
  verticalAlign: commander.verticalAlign,

  output: "stream",
  imageSmoothingEnabled: false
});

const exec = text => {
  const textInput = commander.text || text;
  
  if (!textInput || !commander.output) {
    commander.outputHelp();
    return;
  }

  const options = buildOptions(commander);
  const stream = text2png(textInput, options);
  const outputPath = path.resolve(process.cwd(), commander.output);
  stream.pipe(fs.createWriteStream(outputPath));
};

if (process.stdin.isTTY) {
  exec();
} else {
  let input = "";
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", function(chunk) {
    input += chunk;
  });
  process.stdin.on("end", function() {
    exec(input);
  });
}
