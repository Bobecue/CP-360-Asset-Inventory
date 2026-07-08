/**
 * Code 39 Barcode Generator
 * Generates an SVG representation of a Code 39 barcode without external dependencies.
 */

const CODE39_MAP: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  'A': '100001001',
  'B': '001001001',
  'C': '101001000',
  'D': '000011001',
  'E': '100011000',
  'F': '001011000',
  'G': '000001101',
  'H': '100001100',
  'I': '001001100',
  'J': '000011100',
  'K': '100000011',
  'L': '001000011',
  'M': '101000010',
  'N': '000010011',
  'O': '100010010',
  'P': '001010010',
  'Q': '000000111',
  'R': '100000110',
  'S': '001000110',
  'T': '000010110',
  'U': '110000001',
  'V': '011000001',
  'W': '111000000',
  'X': '010010001',
  'Y': '110010000',
  'Z': '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '*': '010010100', // Start/Stop delimiter
  '$': '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010'
};

export interface BarcodeRect {
  x: number;
  width: number;
}

export interface BarcodeData {
  rects: BarcodeRect[];
  totalWidth: number;
}

/**
 * Encodes text into Code 39 bars layout coordinates.
 * @param text The alphanumeric text to encode.
 * @param narrowWidth Width of narrow bars/spaces in coordinate units (default: 1).
 * @param wideWidth Width of wide bars/spaces in coordinate units (default: 2.5).
 */
export function encodeCode39(
  text: string,
  narrowWidth = 1,
  wideWidth = 2.5
): BarcodeData {
  const formattedText = `*${text.toUpperCase()}*`;
  const rects: BarcodeRect[] = [];
  let currentX = 0;

  for (let i = 0; i < formattedText.length; i++) {
    const char = formattedText[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP[' ']; // Fallback to space

    for (let j = 0; j < pattern.length; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      const elementWidth = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        rects.push({
          x: currentX,
          width: elementWidth,
        });
      }

      currentX += elementWidth;
    }

    // Inter-character gap (narrow space)
    currentX += narrowWidth;
  }

  return {
    rects,
    totalWidth: currentX,
  };
}
