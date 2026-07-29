import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

/**
 * 🎨 Node.js Asset Generator - 39 Tiles/Props + 6 Portraits + 6 Full-Body Field NPC Sprites
 */

const tilesDir = path.resolve('public/assets/tiles');
const propsDir = path.resolve('public/assets/props');
const portraitsDir = path.resolve('public/assets/portraits');
const npcsDir = path.resolve('public/assets/npcs');

if (!fs.existsSync(tilesDir)) fs.mkdirSync(tilesDir, { recursive: true });
if (!fs.existsSync(propsDir)) fs.mkdirSync(propsDir, { recursive: true });
if (!fs.existsSync(portraitsDir)) fs.mkdirSync(portraitsDir, { recursive: true });
if (!fs.existsSync(npcsDir)) fs.mkdirSync(npcsDir, { recursive: true });

function createRawBuffer(width, height, drawFn) {
  const buffer = Buffer.alloc(width * height * 4); // RGBA
  
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    // Alpha blending with existing pixel
    const oldA = buffer[idx + 3] / 255;
    const newA = a / 255;
    if (oldA === 0 || newA === 1) {
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    } else {
      const outA = newA + oldA * (1 - newA);
      buffer[idx] = Math.round((r * newA + buffer[idx] * oldA * (1 - newA)) / outA);
      buffer[idx + 1] = Math.round((g * newA + buffer[idx + 1] * oldA * (1 - newA)) / outA);
      buffer[idx + 2] = Math.round((b * newA + buffer[idx + 2] * oldA * (1 - newA)) / outA);
      buffer[idx + 3] = Math.round(outA * 255);
    }
  }

  function fillRect(rx, ry, rw, rh, r, g, b, a = 255) {
    for (let y = Math.max(0, Math.floor(ry)); y < Math.min(height, Math.ceil(ry + rh)); y++) {
      for (let x = Math.max(0, Math.floor(rx)); x < Math.min(width, Math.ceil(rx + rw)); x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function strokeRect(rx, ry, rw, rh, lineWidth, r, g, b, a = 255) {
    fillRect(rx, ry, rw, lineWidth, r, g, b, a);
    fillRect(rx, ry + rh - lineWidth, rw, lineWidth, r, g, b, a);
    fillRect(rx, ry, lineWidth, rh, r, g, b, a);
    fillRect(rx + rw - lineWidth, ry, lineWidth, rh, r, g, b, a);
  }

  function fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(height - 1, Math.ceil(cy + radius)); y++) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(width - 1, Math.ceil(cx + radius)); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  function strokeCircle(cx, cy, radius, lineWidth, r, g, b, a = 255) {
    const rInner2 = Math.max(0, radius - lineWidth) * Math.max(0, radius - lineWidth);
    const rOuter2 = radius * radius;
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(height - 1, Math.ceil(cy + radius)); y++) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(width - 1, Math.ceil(cx + radius)); x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= rOuter2 && dist2 >= rInner2) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  function fillGradientV(rx, ry, rw, rh, c1, c2) {
    for (let y = Math.max(0, Math.floor(ry)); y < Math.min(height, Math.ceil(ry + rh)); y++) {
      const t = Math.min(1, Math.max(0, (y - ry) / rh));
      const r = Math.round(c1[0] * (1 - t) + c2[0] * t);
      const g = Math.round(c1[1] * (1 - t) + c2[1] * t);
      const b = Math.round(c1[2] * (1 - t) + c2[2] * t);
      const a = c1[3] !== undefined ? Math.round(c1[3] * (1 - t) + (c2[3] ?? 255) * t) : 255;
      for (let x = Math.max(0, Math.floor(rx)); x < Math.min(width, Math.ceil(rx + rw)); x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  drawFn({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV, width, height, buffer });
  return buffer;
}

async function savePng(buffer, width, height, outputPath) {
  const png = new PNG({ width, height });
  buffer.copy(png.data);
  fs.writeFileSync(outputPath, PNG.sync.write(png));
  console.log(`[AssetGen] Successfully generated PNG: ${outputPath}`);
}

async function generateAllAssets() {
  console.log('[AssetGen] Generating High-Detail Tiles, Props, Face Portraits & Field NPC Sprites...');

  // --- TILES (64x64) ---
  const sandBuf = createRawBuffer(64, 64, ({ fillGradientV, fillRect, setPixel }) => {
    fillGradientV(0, 0, 64, 64, [244, 212, 126], [212, 163, 89]);
    fillGradientV(0, 0, 64, 10, [255, 245, 195], [244, 212, 126]);
    for (let i = 0; i < 60; i++) {
      const x = (i * 19 + 7) % 64;
      const y = (i * 29 + 13) % 64;
      setPixel(x, y, 184, 134, 64);
      if (i % 3 === 0) setPixel(x + 1, y, 255, 250, 220);
    }
  });
  await savePng(sandBuf, 64, 64, path.join(tilesDir, 'tile_sand.png'));

  const grassBuf = createRawBuffer(64, 64, ({ fillGradientV, fillRect, strokeRect }) => {
    fillGradientV(0, 0, 64, 64, [75, 48, 28], [35, 20, 10]);
    fillGradientV(0, 0, 64, 18, [46, 204, 113], [30, 132, 73]);
    fillGradientV(0, 0, 64, 4, [130, 224, 170], [46, 204, 113]);
    for (let x = 0; x < 64; x += 6) {
      fillRect(x, 14, 2, 8, 30, 132, 73);
      fillRect(x + 3, 10, 2, 10, 46, 204, 113);
    }
  });
  await savePng(grassBuf, 64, 64, path.join(tilesDir, 'tile_grass.png'));

  const woodBuf = createRawBuffer(64, 64, ({ fillGradientV, fillRect, strokeRect }) => {
    fillGradientV(0, 0, 64, 64, [110, 68, 38], [60, 35, 18]);
    strokeRect(2, 2, 60, 60, 2, [160, 105, 55]);
    for (let y = 12; y < 64; y += 14) {
      fillRect(0, y, 64, 2, [40, 22, 10]);
      fillRect(0, y + 2, 64, 1, [180, 120, 65]);
    }
    // Nails
    fillRect(6, 6, 3, 3, 180, 180, 190);
    fillRect(55, 6, 3, 3, 180, 180, 190);
    fillRect(6, 55, 3, 3, 180, 180, 190);
    fillRect(55, 55, 3, 3, 180, 180, 190);
  });
  await savePng(woodBuf, 64, 64, path.join(tilesDir, 'tile_wood.png'));

  const rockBuf = createRawBuffer(64, 64, ({ fillGradientV, fillRect, strokeRect }) => {
    fillGradientV(0, 0, 64, 64, [60, 35, 35], [25, 12, 12]);
    fillGradientV(0, 0, 64, 14, [231, 76, 60], [146, 43, 33]);
    strokeRect(0, 0, 64, 64, 2, [100, 50, 50]);
  });
  await savePng(rockBuf, 64, 64, path.join(tilesDir, 'tile_rock.png'));

  const coralStoneBuf = createRawBuffer(64, 64, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(0, 0, 64, 64, [235, 238, 243], [180, 190, 205]);
    strokeRect(2, 2, 60, 60, 2, [255, 255, 255]);
    strokeRect(0, 0, 64, 64, 2, [140, 150, 170]);
    // Brick lines
    fillRect(0, 32, 64, 2, [140, 150, 170]);
    fillRect(32, 0, 2, 32, [140, 150, 170]);
    fillRect(16, 32, 2, 32, [140, 150, 170]);
    fillRect(48, 32, 2, 32, [140, 150, 170]);
  });
  await savePng(coralStoneBuf, 64, 64, path.join(tilesDir, 'tile_coral_stone.png'));

  const flowerPathBuf = createRawBuffer(64, 64, ({ fillGradientV, fillCircle, fillRect }) => {
    fillGradientV(0, 0, 64, 64, [46, 204, 113], [24, 106, 59]);
    // Pink & Yellow blossoms
    fillCircle(16, 16, 5, 255, 107, 129);
    fillCircle(16, 16, 2, 241, 196, 15);
    fillCircle(48, 24, 6, 255, 183, 3);
    fillCircle(48, 24, 2, 255, 255, 255);
    fillCircle(30, 48, 5, 238, 90, 36);
    fillCircle(30, 48, 2, 241, 196, 15);
  });
  await savePng(flowerPathBuf, 64, 64, path.join(tilesDir, 'tile_flower_path.png'));

  const cliffBrickBuf = createRawBuffer(64, 64, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(0, 0, 64, 64, [100, 110, 125], [55, 62, 75]);
    strokeRect(0, 0, 64, 64, 2, [40, 45, 55]);
    fillRect(0, 20, 64, 2, [40, 45, 55]);
    fillRect(0, 42, 64, 2, [40, 45, 55]);
  });
  await savePng(cliffBrickBuf, 64, 64, path.join(tilesDir, 'tile_cliff_brick.png'));

  const woodBridgeBuf = createRawBuffer(64, 64, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(0, 0, 64, 64, [140, 85, 45], [80, 45, 20]);
    strokeRect(2, 2, 60, 60, 2, [190, 125, 75]);
    fillRect(0, 0, 64, 6, [60, 30, 10]); // Rope top
    fillRect(0, 58, 64, 6, [60, 30, 10]); // Rope bottom
  });
  await savePng(woodBridgeBuf, 64, 64, path.join(tilesDir, 'tile_wood_bridge.png'));

  const seaBottomBuf = createRawBuffer(64, 64, ({ fillGradientV, fillCircle }) => {
    fillGradientV(0, 0, 64, 64, [12, 36, 97], [4, 12, 45]);
    fillCircle(20, 30, 8, 0, 180, 216, 120);
    fillCircle(45, 48, 12, 0, 119, 182, 100);
  });
  await savePng(seaBottomBuf, 64, 64, path.join(tilesDir, 'tile_sea_bottom.png'));

  // --- BUILDINGS & PROPS WITH RICH GRAPHICS ---
  // Shop (Bakery)
  const shopBuf = createRawBuffer(220, 160, ({ fillGradientV, fillRect, strokeRect, fillCircle }) => {
    fillGradientV(10, 40, 200, 115, [250, 240, 225], [220, 200, 175]);
    strokeRect(10, 40, 200, 115, 4, [130, 80, 40]);
    // Roof Canopy Stripes
    for (let x = 0; x < 220; x += 22) {
      const col = (x / 22) % 2 === 0 ? [231, 76, 60] : [245, 247, 250];
      fillGradientV(x, 10, 22, 35, col, [col[0] * 0.7, col[1] * 0.7, col[2] * 0.7]);
    }
    strokeRect(0, 10, 220, 35, 3, [100, 40, 30]);
    // Door & Windows
    fillGradientV(85, 90, 50, 65, [139, 90, 43], [80, 45, 20]);
    strokeRect(85, 90, 50, 65, 3, [50, 25, 10]);
    fillGradientV(30, 60, 40, 45, [116, 185, 255], [9, 132, 227]);
    strokeRect(30, 60, 40, 45, 3, [130, 80, 40]);
    fillGradientV(150, 60, 40, 45, [116, 185, 255], [9, 132, 227]);
    strokeRect(150, 60, 40, 45, 3, [130, 80, 40]);
    // Signboard
    fillGradientV(60, 48, 100, 20, [241, 196, 15], [211, 84, 0]);
    strokeRect(60, 48, 100, 20, 2, [100, 40, 0]);
  });
  await savePng(shopBuf, 220, 160, path.join(propsDir, 'building_shop.png'));

  // Juice Bar
  const juiceBuf = createRawBuffer(200, 150, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(15, 45, 170, 100, [255, 235, 200], [230, 180, 120]);
    strokeRect(15, 45, 170, 100, 4, [110, 60, 20]);
    // Tropical Leaf Roof
    fillGradientV(5, 5, 190, 42, [46, 204, 113], [24, 106, 59]);
    strokeRect(5, 5, 190, 42, 3, [18, 75, 40]);
    // Counter
    fillGradientV(30, 80, 140, 65, [241, 196, 15], [211, 84, 0]);
    strokeRect(30, 80, 140, 65, 3, [120, 50, 0]);
    fillCircle(70, 70, 10, 231, 76, 60); // Fruit icon
    fillCircle(130, 70, 10, 255, 183, 3);
  });
  await savePng(juiceBuf, 200, 150, path.join(propsDir, 'building_juice_bar.png'));

  // Castle
  const castleBuf = createRawBuffer(420, 300, ({ fillGradientV, strokeRect, fillRect, fillCircle }) => {
    // Main Fortress Body
    fillGradientV(50, 80, 320, 215, [245, 247, 250], [180, 190, 205]);
    strokeRect(50, 80, 320, 215, 6, [70, 80, 95]);
    // Side Towers
    fillGradientV(10, 40, 70, 255, [220, 225, 235], [150, 160, 180]);
    strokeRect(10, 40, 70, 255, 4, [60, 70, 85]);
    fillGradientV(340, 40, 70, 255, [220, 225, 235], [150, 160, 180]);
    strokeRect(340, 40, 70, 255, 4, [60, 70, 85]);
    // Blue Conical Roofs
    fillGradientV(5, 0, 80, 42, [9, 132, 227], [12, 36, 97]);
    fillGradientV(335, 0, 80, 42, [9, 132, 227], [12, 36, 97]);
    fillGradientV(160, 20, 100, 62, [9, 132, 227], [12, 36, 97]);
    // Grand Gate
    fillGradientV(175, 170, 70, 125, [110, 68, 38], [50, 25, 10]);
    strokeRect(175, 170, 70, 125, 5, [241, 196, 15]);
    // Stained Glass Rosette Window
    fillCircle(210, 120, 25, 241, 196, 15);
    fillCircle(210, 120, 20, 231, 76, 60);
    fillCircle(210, 120, 12, 9, 132, 227);
  });
  await savePng(castleBuf, 420, 300, path.join(propsDir, 'building_castle.png'));

  // Manor
  const manorBuf = createRawBuffer(340, 220, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(20, 60, 300, 155, [230, 210, 180], [170, 145, 110]);
    strokeRect(20, 60, 300, 155, 5, [80, 55, 30]);
    // Terracotta Roof
    fillGradientV(0, 15, 340, 50, [211, 84, 0], [140, 45, 0]);
    strokeRect(0, 15, 340, 50, 4, [80, 25, 0]);
    // Columns & Balcony
    fillRect(60, 60, 14, 155, 250, 245, 235);
    fillRect(266, 60, 14, 155, 250, 245, 235);
    fillGradientV(130, 130, 80, 85, [110, 68, 38], [50, 25, 10]);
    strokeRect(130, 130, 80, 85, 4, [241, 196, 15]);
  });
  await savePng(manorBuf, 340, 220, path.join(propsDir, 'building_manor.png'));

  // Observatory Dome
  const obsBuf = createRawBuffer(280, 260, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(30, 90, 220, 165, [140, 150, 165], [80, 90, 105]);
    strokeRect(30, 90, 220, 165, 5, [40, 45, 55]);
    // Metallic Sky Dome
    fillCircle(140, 90, 85, 220, 225, 235);
    fillCircle(140, 90, 80, 116, 185, 255);
    strokeCircle(140, 90, 85, 4, 241, 196, 15);
    // Telescope Barrel
    fillGradientV(110, 10, 110, 30, [241, 196, 15], [180, 130, 0]);
    strokeRect(110, 10, 110, 30, 3, [100, 70, 0]);
  });
  await savePng(obsBuf, 280, 260, path.join(propsDir, 'building_observatory.png'));

  // Grand Lighthouse
  const grandLightBuf = createRawBuffer(120, 320, ({ fillGradientV, strokeRect, fillRect, fillCircle }) => {
    fillGradientV(20, 70, 80, 245, [248, 249, 250], [190, 200, 215]);
    strokeRect(20, 70, 80, 245, 4, [60, 70, 85]);
    // Red Stripes
    fillGradientV(20, 110, 80, 40, [231, 76, 60], [146, 43, 33]);
    fillGradientV(20, 190, 80, 40, [231, 76, 60], [146, 43, 33]);
    // Lantern Housing & Beacon Light
    fillGradientV(10, 20, 100, 52, [255, 234, 167], [255, 184, 77]);
    strokeRect(10, 20, 100, 52, 4, [241, 196, 15]);
    fillCircle(60, 46, 18, 255, 255, 255);
  });
  await savePng(grandLightBuf, 120, 320, path.join(propsDir, 'building_lighthouse_grand.png'));

  // Tavern
  const tavBuf = createRawBuffer(260, 180, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(15, 50, 230, 125, [141, 110, 99], [90, 62, 54]);
    strokeRect(15, 50, 230, 125, 4, [50, 30, 20]);
    // Dark Wooden Roof
    fillGradientV(0, 10, 260, 42, [92, 58, 33], [45, 25, 10]);
    strokeRect(0, 10, 260, 42, 4, [30, 15, 5]);
    // Beer Mug Sign
    fillGradientV(110, 80, 40, 50, [241, 196, 15], [211, 84, 0]);
    strokeRect(110, 80, 40, 50, 3, [255, 255, 255]);
  });
  await savePng(tavBuf, 260, 180, path.join(propsDir, 'building_tavern.png'));

  // Hotel
  const hotelBuf = createRawBuffer(360, 240, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(15, 45, 330, 190, [245, 247, 250], [200, 210, 225]);
    strokeRect(15, 45, 330, 190, 5, [60, 70, 85]);
    // Resort Balconies
    for (let y = 70; y < 220; y += 45) {
      for (let x = 35; x < 320; x += 65) {
        fillGradientV(x, y, 45, 35, [116, 185, 255], [9, 132, 227]);
        strokeRect(x, y, 45, 35, 2, [241, 196, 15]);
      }
    }
  });
  await savePng(hotelBuf, 360, 240, path.join(propsDir, 'building_hotel.png'));

  // Aquarium
  const aquaBuf = createRawBuffer(280, 190, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(10, 40, 260, 145, [0, 119, 182], [3, 4, 94]);
    strokeRect(10, 40, 260, 145, 5, [0, 180, 216]);
    fillCircle(140, 110, 45, 72, 202, 228, 180);
    strokeCircle(140, 110, 45, 4, 255, 255, 255);
  });
  await savePng(aquaBuf, 280, 190, path.join(propsDir, 'building_aquarium.png'));

  // Port Warehouse
  const portBuf = createRawBuffer(240, 170, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(10, 40, 220, 125, [127, 140, 141], [74, 85, 104]);
    strokeRect(10, 40, 220, 125, 4, [44, 62, 80]);
    fillGradientV(70, 80, 100, 85, [180, 100, 40], [100, 50, 20]);
    strokeRect(70, 80, 100, 85, 4, [40, 20, 10]);
  });
  await savePng(portBuf, 240, 170, path.join(propsDir, 'building_port_warehouse.png'));

  // Prop Lighthouse
  const lightBuf = createRawBuffer(90, 230, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(15, 50, 60, 175, [248, 249, 250], [180, 190, 205]);
    strokeRect(15, 50, 60, 175, 3, [60, 70, 85]);
    fillGradientV(15, 80, 60, 30, [231, 76, 60], [146, 43, 33]);
    fillGradientV(15, 140, 60, 30, [231, 76, 60], [146, 43, 33]);
    fillCircle(45, 30, 15, 255, 234, 167);
  });
  await savePng(lightBuf, 90, 230, path.join(propsDir, 'prop_lighthouse.png'));

  // Windmill
  const windBuf = createRawBuffer(140, 200, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(35, 60, 70, 135, [235, 238, 243], [160, 170, 185]);
    strokeRect(35, 60, 70, 135, 4, [60, 70, 85]);
    fillCircle(70, 60, 10, 241, 196, 15);
    // Blades
    fillRect(10, 55, 120, 10, 139, 90, 43);
    fillRect(65, 0, 10, 120, 139, 90, 43);
  });
  await savePng(windBuf, 140, 200, path.join(propsDir, 'prop_windmill.png'));

  // Clocktower
  const clockBuf = createRawBuffer(100, 260, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(20, 60, 60, 195, [212, 163, 115], [140, 95, 55]);
    strokeRect(20, 60, 60, 195, 4, [80, 45, 20]);
    fillCircle(50, 90, 22, 255, 255, 255);
    strokeCircle(50, 90, 22, 3, 241, 196, 15);
  });
  await savePng(clockBuf, 100, 260, path.join(propsDir, 'prop_clocktower.png'));

  // Fountain
  const fountainBuf = createRawBuffer(120, 110, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(10, 50, 100, 55, [200, 210, 225], [140, 150, 165]);
    strokeRect(10, 50, 100, 55, 4, [80, 90, 105]);
    fillCircle(60, 40, 30, 0, 180, 216);
    fillCircle(60, 40, 12, 255, 255, 255);
  });
  await savePng(fountainBuf, 120, 110, path.join(propsDir, 'prop_fountain.png'));

  // Statue
  const statueBuf = createRawBuffer(90, 140, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillGradientV(15, 20, 60, 115, [255, 215, 0], [184, 134, 11]);
    strokeRect(15, 20, 60, 115, 3, [255, 255, 200]);
    fillCircle(45, 30, 16, 255, 235, 120);
    fillRect(10, 125, 70, 15, 80, 80, 90);
  });
  await savePng(statueBuf, 90, 140, path.join(propsDir, 'prop_statue.png'));

  // Ship
  const shipBuf = createRawBuffer(160, 90, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(10, 40, 140, 45, [110, 68, 38], [50, 25, 10]);
    strokeRect(10, 40, 140, 45, 3, [160, 105, 55]);
    // White Sails
    fillGradientV(40, 5, 35, 35, [255, 255, 255], [200, 210, 220]);
    fillGradientV(85, 5, 35, 35, [255, 255, 255], [200, 210, 220]);
  });
  await savePng(shipBuf, 160, 90, path.join(propsDir, 'prop_ship.png'));

  // Flower Arch
  const flowerArchBuf = createRawBuffer(100, 120, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    strokeCircle(50, 60, 42, 10, 46, 204, 113);
    fillCircle(20, 30, 8, 255, 107, 129);
    fillCircle(80, 30, 8, 255, 183, 3);
    fillCircle(50, 18, 8, 238, 90, 36);
  });
  await savePng(flowerArchBuf, 100, 120, path.join(propsDir, 'prop_flower_arch.png'));

  // Coral Reef
  const coralReefBuf = createRawBuffer(80, 80, ({ fillGradientV, fillCircle }) => {
    fillCircle(40, 45, 32, 231, 76, 60);
    fillCircle(25, 35, 18, 255, 107, 129);
    fillCircle(55, 35, 18, 255, 183, 3);
  });
  await savePng(coralReefBuf, 80, 80, path.join(propsDir, 'prop_coral_reef.png'));

  // Waterfall
  const waterfallBuf = createRawBuffer(100, 300, ({ fillGradientV, fillRect }) => {
    fillGradientV(10, 0, 80, 300, [72, 202, 228], [3, 4, 94]);
    for (let y = 0; y < 300; y += 25) {
      fillRect(15, y, 70, 4, 255, 255, 255, 180);
    }
  });
  await savePng(waterfallBuf, 100, 300, path.join(propsDir, 'prop_waterfall.png'));

  // Bridge
  const bridgeBuf = createRawBuffer(180, 60, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(0, 20, 180, 25, [140, 85, 45], [80, 45, 20]);
    strokeRect(0, 20, 180, 25, 3, [190, 125, 75]);
    fillRect(0, 5, 180, 5, [60, 30, 10]);
  });
  await savePng(bridgeBuf, 180, 60, path.join(propsDir, 'prop_bridge.png'));

  // Cannon
  const cannonBuf = createRawBuffer(80, 50, ({ fillGradientV, fillCircle, fillRect }) => {
    fillGradientV(15, 10, 55, 22, [44, 62, 80], [15, 22, 30]);
    fillCircle(25, 35, 14, 110, 68, 38);
    fillCircle(55, 35, 14, 110, 68, 38);
  });
  await savePng(cannonBuf, 80, 50, path.join(propsDir, 'prop_cannon.png'));

  // Chest
  const chestBuf = createRawBuffer(50, 40, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(5, 10, 40, 25, [139, 90, 43], [80, 45, 20]);
    strokeRect(5, 10, 40, 25, 2, [241, 196, 15]);
    fillRect(22, 18, 6, 8, 241, 196, 15);
  });
  await savePng(chestBuf, 50, 40, path.join(propsDir, 'prop_chest.png'));

  // Anchor
  const anchorBuf = createRawBuffer(60, 70, ({ fillGradientV, strokeCircle, strokeRect, fillRect }) => {
    fillGradientV(26, 10, 8, 50, [100, 110, 125], [40, 45, 55]);
    strokeCircle(30, 15, 10, 3, 100, 110, 125);
    fillRect(10, 25, 40, 6, 100, 110, 125);
  });
  await savePng(anchorBuf, 60, 70, path.join(propsDir, 'prop_anchor.png'));

  // Signpost
  const signBuf = createRawBuffer(40, 70, ({ fillGradientV, strokeRect, fillRect }) => {
    fillRect(17, 20, 6, 50, 80, 45, 20);
    fillGradientV(5, 8, 30, 18, [180, 120, 60], [120, 70, 30]);
    strokeRect(5, 8, 30, 18, 2, [60, 30, 10]);
  });
  await savePng(signBuf, 40, 70, path.join(propsDir, 'prop_signpost.png'));

  // Bench
  const benchBuf = createRawBuffer(70, 45, ({ fillGradientV, strokeRect, fillRect }) => {
    fillGradientV(5, 15, 60, 12, [160, 100, 50], [90, 50, 20]);
    strokeRect(5, 15, 60, 12, 2, [50, 25, 10]);
    fillRect(10, 27, 6, 15, 40, 40, 45);
    fillRect(54, 27, 6, 15, 40, 40, 45);
  });
  await savePng(benchBuf, 70, 45, path.join(propsDir, 'prop_bench.png'));

  // Double Streetlamp
  const twinLampBuf = createRawBuffer(40, 100, ({ setPixel, fillRect, strokeRect, fillCircle, strokeCircle, fillGradientV }) => {
    fillRect(18, 20, 4, 80, 44, 62, 80);
    fillCircle(8, 20, 8, 255, 234, 167);
    fillCircle(32, 20, 8, 255, 234, 167);
  });
  await savePng(twinLampBuf, 40, 100, path.join(propsDir, 'prop_streetlamp_double.png'));

  // Palm Tree
  const palmBuf = createRawBuffer(130, 170, ({ fillGradientV, strokeCircle, fillCircle, fillRect }) => {
    // Curved Trunk
    fillRect(58, 60, 14, 105, 120, 70, 30);
    // Fronds
    fillCircle(65, 50, 45, 46, 204, 113);
    fillCircle(35, 40, 35, 39, 174, 96);
    fillCircle(95, 40, 35, 39, 174, 96);
    fillCircle(65, 55, 12, 139, 90, 43); // Coconuts
  });
  await savePng(palmBuf, 130, 170, path.join(propsDir, 'prop_palm_tree.png'));

  // Parasol
  const paraBuf = createRawBuffer(80, 90, ({ fillGradientV, fillCircle, fillRect }) => {
    fillRect(38, 30, 4, 58, 200, 200, 210);
    fillCircle(40, 30, 35, 231, 76, 60);
    fillCircle(40, 30, 20, 255, 255, 255);
  });
  await savePng(paraBuf, 80, 90, path.join(propsDir, 'prop_parasol.png'));

  // Lantern
  const lantBuf = createRawBuffer(30, 80, ({ fillGradientV, fillCircle, fillRect }) => {
    fillRect(14, 0, 2, 35, 80, 80, 90);
    fillCircle(15, 45, 12, 255, 183, 3);
    fillCircle(15, 45, 6, 255, 255, 255);
  });
  await savePng(lantBuf, 30, 80, path.join(propsDir, 'prop_lantern.png'));

  // Boat
  const boatBuf = createRawBuffer(80, 35, ({ fillGradientV, strokeRect }) => {
    fillGradientV(5, 10, 70, 20, [141, 110, 99], [80, 50, 40]);
    strokeRect(5, 10, 70, 20, 2, [180, 130, 80]);
  });
  await savePng(boatBuf, 80, 35, path.join(propsDir, 'prop_boat.png'));

  // --- 128x128 FACE PORTRAITS (HIGH DETAIL) ---
  const liriaPortBuf = createRawBuffer(128, 128, ({ fillGradientV, strokeCircle, fillCircle, setPixel, fillRect }) => {
    fillGradientV(0, 0, 128, 128, [255, 154, 162], [255, 183, 178]);
    strokeCircle(64, 64, 60, 4, 255, 255, 255);
    // Face & Eyes
    fillCircle(64, 68, 42, 255, 218, 193);
    fillCircle(46, 66, 8, 46, 204, 113);
    fillCircle(82, 66, 8, 46, 204, 113);
    fillCircle(46, 66, 3, 255, 255, 255);
    fillCircle(82, 66, 3, 255, 255, 255);
    // Pink Hair & Hibiscus
    fillCircle(64, 30, 38, 255, 107, 129);
    fillCircle(98, 40, 14, 241, 196, 15);
  });
  await savePng(liriaPortBuf, 128, 128, path.join(portraitsDir, 'portrait_liria.png'));

  const petePortBuf = createRawBuffer(128, 128, ({ fillGradientV, strokeCircle, fillCircle, fillRect }) => {
    fillGradientV(0, 0, 128, 128, [44, 62, 80], [20, 30, 45]);
    strokeCircle(64, 64, 60, 4, 241, 196, 15);
    fillCircle(64, 68, 40, 230, 184, 156);
    fillCircle(64, 92, 34, 245, 246, 250); // White Beard
    // Captain's Hat
    fillRect(24, 20, 80, 28, 27, 20, 100);
    fillRect(20, 44, 88, 8, 241, 196, 15);
  });
  await savePng(petePortBuf, 128, 128, path.join(portraitsDir, 'portrait_pete.png'));

  const kaelPortBuf = createRawBuffer(128, 128, ({ fillGradientV, strokeCircle, fillCircle, fillRect }) => {
    fillGradientV(0, 0, 128, 128, [24, 44, 97], [10, 20, 50]);
    strokeCircle(64, 64, 60, 4, 235, 77, 75);
    fillCircle(64, 68, 42, 217, 155, 115);
    // Red Bandana & Eyepatch
    fillRect(20, 18, 88, 24, 235, 77, 75);
    fillCircle(46, 64, 10, 47, 54, 64);
    fillCircle(82, 64, 8, 0, 210, 211);
  });
  await savePng(kaelPortBuf, 128, 128, path.join(portraitsDir, 'portrait_kael.png'));

  const carlPortBuf = createRawBuffer(128, 128, ({ fillGradientV, strokeCircle, fillCircle, fillRect }) => {
    fillGradientV(0, 0, 128, 128, [241, 196, 15], [180, 130, 0]);
    strokeCircle(64, 64, 60, 4, 231, 76, 60);
    fillCircle(64, 68, 42, 229, 169, 117);
    fillRect(24, 24, 80, 40, 241, 196, 15);
    fillCircle(64, 34, 10, 231, 76, 60);
  });
  await savePng(carlPortBuf, 128, 128, path.join(portraitsDir, 'portrait_wrestler_king.png'));

  const orionPortBuf = createRawBuffer(128, 128, ({ fillGradientV, strokeCircle, fillCircle }) => {
    fillGradientV(0, 0, 128, 128, [12, 36, 97], [4, 12, 45]);
    strokeCircle(64, 64, 60, 4, 116, 185, 255);
    fillCircle(64, 68, 40, 245, 230, 202);
    fillCircle(64, 30, 42, 24, 44, 97);
    fillCircle(46, 66, 10, 241, 196, 15);
    fillCircle(82, 66, 10, 241, 196, 15);
  });
  await savePng(orionPortBuf, 128, 128, path.join(portraitsDir, 'portrait_astronomer.png'));

  const lunaPortBuf = createRawBuffer(128, 128, ({ fillGradientV, strokeCircle, fillCircle, setPixel }) => {
    fillGradientV(0, 0, 128, 128, [108, 92, 231], [60, 45, 150]);
    strokeCircle(64, 64, 60, 4, 254, 202, 87);
    fillCircle(64, 68, 40, 255, 234, 167);
    fillCircle(64, 32, 40, 108, 92, 231);
    fillCircle(46, 66, 8, 162, 155, 254);
    fillCircle(82, 66, 8, 162, 155, 254);
  });
  await savePng(lunaPortBuf, 128, 128, path.join(portraitsDir, 'portrait_luna.png'));

  // --- FULL-BODY FIELD NPC SPRITES (90x115) ---
  const nLiriaBuf = createRawBuffer(90, 115, ({ fillGradientV, fillCircle, fillRect, strokeRect }) => {
    fillGradientV(25, 45, 40, 50, [46, 204, 113], [24, 106, 59]);
    strokeRect(25, 45, 40, 50, 2, [18, 75, 40]);
    fillRect(35, 45, 20, 50, 248, 249, 250);
    fillCircle(45, 26, 20, 255, 209, 179);
    fillCircle(45, 20, 22, 255, 107, 129);
    fillCircle(62, 14, 8, 241, 196, 15);
  });
  await savePng(nLiriaBuf, 90, 115, path.join(npcsDir, 'npc_liria.png'));

  const nPeteBuf = createRawBuffer(90, 115, ({ fillGradientV, fillCircle, fillRect, strokeRect }) => {
    fillGradientV(22, 45, 46, 52, [27, 20, 100], [15, 10, 60]);
    strokeRect(22, 45, 46, 52, 2, [241, 196, 15]);
    fillCircle(45, 28, 18, 230, 184, 156);
    fillCircle(45, 38, 16, 245, 246, 250);
    fillRect(20, 8, 50, 18, 27, 20, 100);
  });
  await savePng(nPeteBuf, 90, 115, path.join(npcsDir, 'npc_pete.png'));

  const nKaelBuf = createRawBuffer(90, 115, ({ fillGradientV, fillCircle, fillRect }) => {
    fillGradientV(25, 45, 40, 30, [24, 44, 97], [10, 20, 50]);
    fillCircle(45, 28, 19, 217, 155, 115);
    fillRect(20, 10, 50, 14, 235, 77, 75);
    fillCircle(38, 26, 6, 47, 54, 64);
  });
  await savePng(nKaelBuf, 90, 115, path.join(npcsDir, 'npc_kael.png'));

  const nCarlBuf = createRawBuffer(90, 115, ({ fillGradientV, fillCircle, fillRect }) => {
    fillGradientV(24, 42, 42, 35, [229, 169, 117], [170, 110, 60]);
    fillRect(22, 72, 46, 12, 241, 196, 15);
    fillCircle(45, 26, 18, 229, 169, 117);
    fillRect(25, 10, 40, 22, 241, 196, 15);
  });
  await savePng(nCarlBuf, 90, 115, path.join(npcsDir, 'npc_wrestler_king.png'));

  const nOrionBuf = createRawBuffer(90, 115, ({ fillGradientV, fillCircle, fillRect }) => {
    fillGradientV(22, 42, 46, 56, [12, 36, 97], [4, 12, 45]);
    fillCircle(45, 26, 18, 245, 230, 202);
    fillCircle(45, 22, 22, 24, 44, 97);
    fillCircle(38, 26, 6, 241, 196, 15);
    fillCircle(52, 26, 6, 241, 196, 15);
  });
  await savePng(nOrionBuf, 90, 115, path.join(npcsDir, 'npc_astronomer.png'));

  const nLunaBuf = createRawBuffer(90, 115, ({ fillGradientV, fillCircle, fillRect }) => {
    fillGradientV(26, 44, 38, 28, [108, 92, 231], [60, 45, 150]);
    fillCircle(45, 26, 18, 255, 234, 167);
    fillCircle(45, 20, 21, 108, 92, 231);
  });
  await savePng(nLunaBuf, 90, 115, path.join(npcsDir, 'npc_luna.png'));

  console.log('[AssetGen] All High-Detail PNG Assets, Face Portraits & Field NPC Sprites successfully generated!');
}

generateAllAssets().catch(err => {
  console.error('[AssetGen] Error:', err);
  process.exit(1);
});

generateAllAssets().catch(err => {
  console.error('[AssetGen] Error:', err);
  process.exit(1);
});
