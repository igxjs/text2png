import { Readable } from 'node:stream';
import { Canvas } from 'canvas';

export interface Text2PngOptions {
  /** CSS style font (default: "30px sans-serif") */
  font?: string;
  
  /** Text alignment (default: "left") */
  textAlign?: "left" | "center" | "right" | "start" | "end";
  
  /** Text color (default: "black") */
  color?: string;
  
  /** Text color (alias for color, default: "black") */
  textColor?: string;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Background color (alias for backgroundColor) */
  bgColor?: string;
  
  /** Line spacing (default: 0) */
  lineSpacing?: number;
  
  /** Stroke width (default: 0) */
  strokeWidth?: number;
  
  /** Stroke color (default: "white") */
  strokeColor?: string;
  
  /** Padding for all sides (default: 0) */
  padding?: number;
  
  /** Left padding */
  paddingLeft?: number;
  
  /** Top padding */
  paddingTop?: number;
  
  /** Right padding */
  paddingRight?: number;
  
  /** Bottom padding */
  paddingBottom?: number;
  
  /** Border width for all sides (default: 0) */
  borderWidth?: number;
  
  /** Left border width (default: 0) */
  borderLeftWidth?: number;
  
  /** Top border width (default: 0) */
  borderTopWidth?: number;
  
  /** Right border width (default: 0) */
  borderRightWidth?: number;
  
  /** Bottom border width (default: 0) */
  borderBottomWidth?: number;
  
  /** Border color (default: "black") */
  borderColor?: string;
  
  /** Path to local font file (e.g., fonts/Lobster-Regular.ttf) */
  localFontPath?: string;
  
  /** Name of local font (e.g., Lobster) */
  localFontName?: string;
  
  /** Output type (default: "buffer") */
  output?: "buffer" | "stream" | "dataURL" | "canvas";

  /** Enable or disable image smoothing (default: false) */
  imageSmoothingEnabled?: boolean;

  /** Fixed width in pixels (optional, defaults to auto-calculated) */
  width?: number;

  /** Fixed height in pixels (optional, defaults to auto-calculated) */
  height?: number;

  /** Minimum font size when auto-scaling to fit fixed dimensions (default: 8) */
  minFontSize?: number;

  /** Vertical alignment when height is fixed (default: "middle") */
  verticalAlign?: "top" | "middle" | "bottom";
}

declare function text2png(text: string, options?: Text2PngOptions): string | Buffer | Readable | Canvas;

export default text2png;

export { text2png };
