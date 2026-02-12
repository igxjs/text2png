const { registerFont, createCanvas } = require("canvas");

/**
 * Convert text to PNG image.
 * @param {string} text Text to convert
 * @param {import('./types').Text2PngOptions} options Options
 * @returns {string|Buffer|import('node:stream').Readable|import('canvas').Canvas} Returns PNG data as specified by options.output
 */
const text2png = (text, options = {}) => {
  options = parseOptions(options);
  registerCustomFont(options);

  const canvas = createCanvas(0, 0);
  const ctx = canvas.getContext("2d");

  // Measure text and calculate natural dimensions
  const textMetrics = measureTextMetrics(ctx, text, options);
  const naturalDimensions = calculateNaturalDimensions(textMetrics, options);

  // Apply dimensions and scaling
  const dimensions = applyDimensions(canvas, textMetrics, naturalDimensions, options);

  // Render background and border
  renderBackground(ctx, canvas, options);

  // Configure context for text rendering
  configureContext(ctx, dimensions.finalFont, dimensions.scaleFactor, options);

  // Calculate positioning offsets
  const offsets = calculateOffsets(canvas, dimensions, options);

  // Render text lines
  renderTextLines(ctx, dimensions.scaledLineProps, dimensions.scaledMax, dimensions.scaledLineHeight, offsets, options, canvas);

  return formatOutput(canvas, options);
};

/**
 * Register custom font if provided
 */
function registerCustomFont(options) {
  if (options.localFontPath && options.localFontName) {
    try {
      registerFont(options.localFontPath, { family: options.localFontName });
    } catch (error) {
      throw new Error(`Failed to load local font from path: ${options.localFontPath}, error: ${error.message}`);
    }
  }
}

/**
 * Measure text and calculate metrics for all lines
 */
function measureTextMetrics(ctx, text, options) {
  const max = { left: 0, right: 0, ascent: 0, descent: 0 };
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
  const contentHeight = lineHeight * lineProps.length - options.lineSpacing - (max.descent - lastDescent);

  return { max, lineProps, lastDescent, lineHeight, contentWidth, contentHeight };
}

/**
 * Calculate natural canvas dimensions without fixed sizing
 */
function calculateNaturalDimensions(textMetrics, options) {
  const width = textMetrics.contentWidth +
    options.borderLeftWidth + options.borderRightWidth +
    options.paddingLeft + options.paddingRight;

  const height = textMetrics.contentHeight +
    options.borderTopWidth + options.borderBottomWidth +
    options.paddingTop + options.paddingBottom;

  return { width, height };
}

/**
 * Apply dimensions and calculate scaling if needed
 */
function applyDimensions(canvas, textMetrics, naturalDimensions, options) {
  const hasFixedDimensions = options.width || options.height;

  if (!hasFixedDimensions) {
    // Auto-size mode
    canvas.width = naturalDimensions.width;
    canvas.height = naturalDimensions.height;
    return {
      scaleFactor: 1,
      finalFont: options.font,
      scaledMax: { ...textMetrics.max },
      scaledLineProps: textMetrics.lineProps,
      scaledLineHeight: textMetrics.lineHeight
    };
  }

  // Fixed dimension mode
  const targetWidth = options.width || naturalDimensions.width;
  const targetHeight = options.height || naturalDimensions.height;

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const availableWidth = targetWidth - options.borderLeftWidth - options.borderRightWidth - options.paddingLeft - options.paddingRight;
  const availableHeight = targetHeight - options.borderTopWidth - options.borderBottomWidth - options.paddingTop - options.paddingBottom;

  let scaleFactor = calculateScaleFactor(textMetrics.contentWidth, textMetrics.contentHeight, availableWidth, availableHeight);

  if (scaleFactor < 1) {
    const scalingResult = applyFontScaling(options.font, scaleFactor, options.minFontSize);
    scaleFactor = scalingResult.actualScaleFactor;

    return {
      scaleFactor,
      finalFont: scalingResult.finalFont,
      scaledMax: scaleMetrics(textMetrics.max, scaleFactor),
      scaledLineProps: scaleLineProps(textMetrics.lineProps, scaleFactor),
      scaledLineHeight: textMetrics.lineHeight * scaleFactor
    };
  }

  return {
    scaleFactor: 1,
    finalFont: options.font,
    scaledMax: { ...textMetrics.max },
    scaledLineProps: textMetrics.lineProps,
    scaledLineHeight: textMetrics.lineHeight
  };
}

/**
 * Apply font scaling based on scale factor and minimum font size
 */
function applyFontScaling(font, scaleFactor, minFontSize) {
  const originalFontSize = extractFontSize(font);
  const scaledFontSize = Math.max(originalFontSize * scaleFactor, minFontSize);
  const actualScaleFactor = scaledFontSize === minFontSize ? scaledFontSize / originalFontSize : scaleFactor;

  return {
    finalFont: setFontSize(font, scaledFontSize),
    actualScaleFactor
  };
}

/**
 * Scale metrics object
 */
function scaleMetrics(max, scaleFactor) {
  return {
    left: max.left * scaleFactor,
    right: max.right * scaleFactor,
    ascent: max.ascent * scaleFactor,
    descent: max.descent * scaleFactor
  };
}

/**
 * Scale line properties
 */
function scaleLineProps(lineProps, scaleFactor) {
  return lineProps.map(prop => ({
    line: prop.line,
    left: prop.left * scaleFactor,
    right: prop.right * scaleFactor,
    ascent: prop.ascent * scaleFactor,
    descent: prop.descent * scaleFactor
  }));
}

/**
 * Render background and border
 */
function renderBackground(ctx, canvas, options) {
  const hasBorder = options.borderLeftWidth || options.borderTopWidth || options.borderRightWidth || options.borderBottomWidth;

  if (hasBorder) {
    ctx.fillStyle = options.borderColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const innerX = options.borderLeftWidth;
  const innerY = options.borderTopWidth;
  const innerWidth = canvas.width - (options.borderLeftWidth + options.borderRightWidth);
  const innerHeight = canvas.height - (options.borderTopWidth + options.borderBottomWidth);

  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
  } else if (hasBorder) {
    ctx.clearRect(innerX, innerY, innerWidth, innerHeight);
  }
}

/**
 * Configure canvas context for text rendering
 */
function configureContext(ctx, finalFont, scaleFactor, options) {
  ctx.font = finalFont;
  ctx.fillStyle = options.textColor;
  ctx.antialias = 'gray';
  ctx.imageSmoothingEnabled = options.imageSmoothingEnabled;
  ctx.textAlign = options.textAlign;
  ctx.lineWidth = options.strokeWidth * scaleFactor;
  ctx.strokeStyle = options.strokeColor;
}

/**
 * Calculate vertical and horizontal offsets for text positioning
 */
function calculateOffsets(canvas, dimensions, options) {
  const verticalOffset = calculateVerticalOffset(canvas, dimensions, options);
  const horizontalOffset = calculateHorizontalOffset(canvas, dimensions, options);

  return { verticalOffset, horizontalOffset };
}

/**
 * Calculate vertical offset based on alignment
 */
function calculateVerticalOffset(canvas, dimensions, options) {
  if (!options.height) {
    return 0;
  }

  const availableHeight = canvas.height - options.borderTopWidth - options.borderBottomWidth - options.paddingTop - options.paddingBottom;
  const scaledContentHeight = dimensions.scaledLineHeight * dimensions.scaledLineProps.length - 
    options.lineSpacing * dimensions.scaleFactor - 
    (dimensions.scaledMax.descent - dimensions.scaledLineProps[dimensions.scaledLineProps.length - 1].descent);

  switch (options.verticalAlign) {
    case "top":
      return 0;
    case "middle":
      return (availableHeight - scaledContentHeight) / 2;
    case "bottom":
      return availableHeight - scaledContentHeight;
    default:
      return 0;
  }
}

/**
 * Calculate horizontal offset based on alignment
 */
function calculateHorizontalOffset(canvas, dimensions, options) {
  if (!options.width) {
    return 0;
  }

  const availableWidth = canvas.width - options.borderLeftWidth - options.borderRightWidth - options.paddingLeft - options.paddingRight;
  const scaledContentWidth = dimensions.scaledMax.left + dimensions.scaledMax.right;

  if (options.textAlign === 'center') {
    return (availableWidth - scaledContentWidth) / 2;
  } else if (options.textAlign === 'right' || options.textAlign === 'end') {
    return availableWidth - scaledContentWidth;
  }

  return 0;
}

/**
 * Render text lines
 */
function renderTextLines(ctx, scaledLineProps, scaledMax, scaledLineHeight, offsets, options, canvas) {
  let offsetY = options.borderTopWidth + options.paddingTop + offsets.verticalOffset;

  scaledLineProps.forEach(lineProp => {
    const x = calculateTextX(lineProp, scaledMax, offsets.horizontalOffset, options, canvas);
    const y = scaledMax.ascent + offsetY;

    ctx.fillText(lineProp.line, x, y);

    if (options.strokeWidth > 0) {
      ctx.strokeText(lineProp.line, x, y);
    }

    offsetY += scaledLineHeight;
  });
}

/**
 * Calculate X position for text based on alignment
 */
function calculateTextX(lineProp, scaledMax, horizontalOffset, options, canvas) {
  switch (options.textAlign) {
    case "start":
    case "left":
      return lineProp.left + options.borderLeftWidth + options.paddingLeft + horizontalOffset;

    case "end":
    case "right":
      return canvas.width - options.borderRightWidth - options.paddingRight - horizontalOffset;

    case "center":
      return (scaledMax.left + scaledMax.right) / 2 + options.borderLeftWidth + options.paddingLeft + horizontalOffset;

    default:
      return lineProp.left + options.borderLeftWidth + options.paddingLeft + horizontalOffset;
  }
}

/**
 * Format output based on options
 */
function formatOutput(canvas, options) {
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
}

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

    imageSmoothingEnabled: orOr(options.imageSmoothingEnabled, false),

    width: orOr(options.width, null),
    height: orOr(options.height, null),
    minFontSize: orOr(options.minFontSize, 8),
    verticalAlign: orOr(options.verticalAlign, "middle")
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

/**
 * Extract font size from font string (e.g., "30px sans-serif" -> 30)
 * @param {string} font Font string
 * @returns {number} Font size in pixels
 */
function extractFontSize(font) {
  const regex = /(\d+(?:\.\d+)?)\s*px/i;
  const match = regex.exec(font);
  return match ? Number.parseFloat(match[1]) : 30;
}

/**
 * Create new font string with different size
 * @param {string} font Original font string
 * @param {number} newSize New size in pixels
 * @returns {string} New font string
 */
function setFontSize(font, newSize) {
  const regex = /(\d+(?:\.\d+)?)\s*px/i;
  return font.replace(regex, `${newSize}px`);
}

/**
 * Calculate scale factor to fit content in fixed dimensions
 * @param {number} contentWidth Natural content width
 * @param {number} contentHeight Natural content height
 * @param {number} availableWidth Available width
 * @param {number} availableHeight Available height
 * @returns {number} Scale factor (1 = no scaling needed)
 */
function calculateScaleFactor(contentWidth, contentHeight, availableWidth, availableHeight) {
  const widthScale = availableWidth / contentWidth;
  const heightScale = availableHeight / contentHeight;
  return Math.min(widthScale, heightScale, 1);
}

module.exports = text2png;

module.exports.text2png = text2png;
