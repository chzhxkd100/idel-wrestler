import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Advanced BFS Flood-Fill Background Removal Tool
 * - Automatically detects background color from image border/corners or user target color
 * - Erases connected background pixels to alpha=0
 * - Preserves inner white/bright details of the sprite
 * - Saves transparent PNG
 */
export async function removeBackground(inputPath, outputPath, options = {}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const threshold = options.threshold ?? 45;
  
  // Read image into raw RGBA buffer
  const image = sharp(inputPath).ensureAlpha();
  const metadata = await image.metadata();
  const { width, height } = metadata;

  const { data } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Sample corner pixel as background color if not provided
  let bgR = options.bgR;
  let bgG = options.bgG;
  let bgB = options.bgB;

  if (bgR === undefined || bgG === undefined || bgB === undefined) {
    bgR = data[0];
    bgG = data[1];
    bgB = data[2];
  }

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let head = 0;
  let tail = 0;

  function colorDist(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function isBgColor(pixelOffset) {
    const r = data[pixelOffset];
    const g = data[pixelOffset + 1];
    const b = data[pixelOffset + 2];
    return colorDist(r, g, b, bgR, bgG, bgB) <= threshold;
  }

  // Enqueue outer border pixels that match background color
  for (let x = 0; x < width; x++) {
    // Top border
    const pIdxTop = 0 * width + x;
    if (isBgColor(pIdxTop * 4) && !visited[pIdxTop]) {
      visited[pIdxTop] = 1;
      queue[tail++] = x;
      queue[tail++] = 0;
    }
    // Bottom border
    const pIdxBottom = (height - 1) * width + x;
    if (isBgColor(pIdxBottom * 4) && !visited[pIdxBottom]) {
      visited[pIdxBottom] = 1;
      queue[tail++] = x;
      queue[tail++] = height - 1;
    }
  }

  for (let y = 0; y < height; y++) {
    // Left border
    const pIdxLeft = y * width + 0;
    if (isBgColor(pIdxLeft * 4) && !visited[pIdxLeft]) {
      visited[pIdxLeft] = 1;
      queue[tail++] = 0;
      queue[tail++] = y;
    }
    // Right border
    const pIdxRight = y * width + (width - 1);
    if (isBgColor(pIdxRight * 4) && !visited[pIdxRight]) {
      visited[pIdxRight] = 1;
      queue[tail++] = width - 1;
      queue[tail++] = y;
    }
  }

  // BFS search
  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  while (head < tail) {
    const cx = queue[head++];
    const cy = queue[head++];
    const pIdx = cy * width + cx;
    const pixelOffset = pIdx * 4;

    // Erase alpha
    data[pixelOffset + 3] = 0;

    for (let i = 0; i < 4; i++) {
      const nx = cx + dx[i];
      const ny = cy + dy[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPidx = ny * width + nx;
        if (!visited[nPidx]) {
          if (isBgColor(nPidx * 4)) {
            visited[nPidx] = 1;
            queue[tail++] = nx;
            queue[tail++] = ny;
          }
        }
      }
    }
  }

  // Optional: Global color removal option (if sprite has disconnected background pockets)
  if (options.forceGlobal) {
    for (let i = 0; i < width * height; i++) {
      const offset = i * 4;
      if (isBgColor(offset)) {
        data[offset + 3] = 0;
      }
    }
  }

  // Ensure target output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Save to PNG
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`[RemoveBG] Successfully generated transparent image: ${outputPath}`);
  return outputPath;
}

// CLI runner
if (process.argv[1] && process.argv[1].includes('remove_bg.js')) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node tools/remove_bg.js <inputPath> <outputPath> [threshold] [hexBgColor]');
    process.exit(1);
  }

  const input = args[0];
  const output = args[1];
  const thresh = args[2] ? parseInt(args[2], 10) : 45;

  let options = { threshold: thresh };
  if (args[3]) {
    const hex = args[3].replace('#', '');
    options.bgR = parseInt(hex.substring(0, 2), 16);
    options.bgG = parseInt(hex.substring(2, 4), 16);
    options.bgB = parseInt(hex.substring(4, 6), 16);
  }

  removeBackground(input, output, options).catch(err => {
    console.error('[RemoveBG] Error:', err);
    process.exit(1);
  });
}
