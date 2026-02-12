const { registerFont, createCanvas } = require("canvas");

/**
 * Convert text to PNG image.
 * @param {string} text Text to convert
 * @param {import('./types').Text2PngOptions} options Options
 * @returns {string|Buffer|import('node:stream').Readable|import('canvas').Canvas} Returns PNG data as specified by options.output
 */
const text2png = (text, options = {}) => {
  // Options
  options = parseOptions(options);

  // Register a custom font
  if (options.localFontPath && options.localFontName) {
    try {
      registerFont(options.localFontPath, { family: options.localFontName });
    }
    catch(error) {
      throw new Error(`Failed to load local font from path: ${options.localFontPath}, error: ${error.message}`);
    }
  }

  const canvas = createCanvas(0, 0);
  const ctx = canvas.getContext("2d");

  const max = {
    left: 0,
    right: 0,
    ascent: 0,
    descent: 0
  };

  let lastDescent;
  const lineProps = text.split("\n").map(line => {
    ctx.font = options.font;
    const metrics = ctx.measureText(line);

    const left = -1 * metrics.actualBoundingBoxLeft;
    const right = metrics.actualBoundingBoxRight;
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;

    max.left = Math.max(max.left, left);
    max.right = Math.max(max.right, right);
    max.ascent = Math.max(max.ascent, ascent);
    max.descent = Math.max(max.descent, descent);
    lastDescent = descent;

    return { line, left, right, ascent, descent };
  });

  const lineHeight = max.ascent + max.descent + options.lineSpacing;

  const contentWidth = max.left + max.right;
  const contentHeight =
    lineHeight * lineProps.length -
    options.lineSpacing -
    (max.descent - lastDescent);

  canvas.width =
    contentWidth +
    options.borderLeftWidth +
    options.borderRightWidth +
    options.paddingLeft +
    options.paddingRight;

  canvas.height =
    contentHeight +
    options.borderTopWidth +
    options.borderBottomWidth +
    options.paddingTop +
    options.paddingBottom;

  const hasBorder =
    options.borderLeftWidth ||
    options.borderTopWidth ||
    options.borderRightWidth ||
    options.borderBottomWidth || false;

  if (hasBorder) {
    ctx.fillStyle = options.borderColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(
      options.borderLeftWidth,
      options.borderTopWidth,
      canvas.width - (options.borderLeftWidth + options.borderRightWidth),
      canvas.height - (options.borderTopWidth + options.borderBottomWidth)
    );
  } else if (hasBorder) {
    ctx.clearRect(
      options.borderLeftWidth,
      options.borderTopWidth,
      canvas.width - (options.borderLeftWidth + options.borderRightWidth),
      canvas.height - (options.borderTopWidth + options.borderBottomWidth)
    );
  }

  ctx.font = options.font;
  ctx.fillStyle = options.textColor;
  ctx.antialias = 'gray';
  ctx.imageSmoothingEnabled = options.imageSmoothingEnabled;
  ctx.textAlign = options.textAlign;
  ctx.lineWidth = options.strokeWidth;
  ctx.strokeStyle = options.strokeColor;

  let offsetY = options.borderTopWidth + options.paddingTop;
  lineProps.forEach(lineProp => {
    // Calculate Y
    let x = 0;
    const y = max.ascent + offsetY;

    // Calculate X
    switch (options.textAlign) {
      case "start":
      case "left":
        x = lineProp.left + options.borderLeftWidth + options.paddingLeft;
        break;

      case "end":
      case "right":
        x =
          canvas.width -
          lineProp.left -
          options.borderRightWidth -
          options.paddingRight;
        break;

      case "center":
        x = contentWidth / 2 + options.borderLeftWidth + options.paddingLeft;
        break;
    }

    ctx.fillText(lineProp.line, x, y);

    if (options.strokeWidth > 0) {
      ctx.strokeText(lineProp.line, x, y);
    }

    offsetY += lineHeight;
  });

  switch (options.output) {
    case "buffer":
      return canvas.toBuffer();
    case "stream":
      return canvas.createPNGStream();
    case "dataURL":
      return canvas.toDataURL("image/png");
    case "canvas":
      return canvas;
    default:
      throw new Error(`output type:${options.output} is not supported.`);
  }
};

function parseOptions(options) {
  return {
    font: orOr(options.font, "30px sans-serif"),
    textAlign: orOr(options.textAlign, "left"),
    textColor: orOr(options.textColor, options.color, "black"),
    backgroundColor: orOr(options.bgColor, options.backgroundColor, null),
    lineSpacing: orOr(options.lineSpacing, 0),

    strokeWidth: orOr(options.strokeWidth, 0),
    strokeColor: orOr(options.strokeColor, "white"),

    paddingLeft: orOr(options.paddingLeft, options.padding, 0),
    paddingTop: orOr(options.paddingTop, options.padding, 0),
    paddingRight: orOr(options.paddingRight, options.padding, 0),
    paddingBottom: orOr(options.paddingBottom, options.padding, 0),

    borderLeftWidth: orOr(options.borderLeftWidth, options.borderWidth, 0),
    borderTopWidth: orOr(options.borderTopWidth, options.borderWidth, 0),
    borderBottomWidth: orOr(options.borderBottomWidth, options.borderWidth, 0),
    borderRightWidth: orOr(options.borderRightWidth, options.borderWidth, 0),
    borderColor: orOr(options.borderColor, "black"),

    localFontName: orOr(options.localFontName, null),
    localFontPath: orOr(options.localFontPath, null),

    output: orOr(options.output, "buffer"),

    imageSmoothingEnabled: orOr(options.imageSmoothingEnabled, false)
  };
}

function orOr() {
  for (const arg of arguments) {
    if (arg !== undefined && arg !== null) {
      return arg;
    }
  }
  return arguments[arguments.length - 1];
}

module.exports = text2png;

module.exports.text2png = text2png;
