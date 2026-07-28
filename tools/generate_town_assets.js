import sharp from 'sharp';
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
    buffer[idx] = r;
    buffer[idx + 1] = g;
    buffer[idx + 2] = b;
    buffer[idx + 3] = a;
  }

  function fillRect(rx, ry, rw, rh, r, g, b, a = 255) {
    for (let y = Math.max(0, ry); y < Math.min(height, ry + rh); y++) {
      for (let x = Math.max(0, rx); x < Math.min(width, rx + rw); x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function fillCircle(cx, cy, radius, r, g, b, a = 255) {
    for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radius * radius) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  drawFn({ setPixel, fillRect, fillCircle, width, height, buffer });
  return buffer;
}

async function savePng(buffer, width, height, outputPath) {
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);
  console.log(`[AssetGen] Successfully generated PNG: ${outputPath}`);
}

async function generateAllAssets() {
  console.log('[AssetGen] Generating Tiles, Props, Face Portraits & Field NPC Sprites...');

  // --- TILES & PROPS GENERATION ---
  const sandBuf = createRawBuffer(64, 64, ({ fillRect, setPixel }) => {
    fillRect(0, 0, 64, 64, 233, 196, 106);
    fillRect(0, 0, 64, 8, 254, 250, 224);
    for (let i = 0; i < 40; i++) setPixel((i * 17 + 5) % 64, (i * 23 + 12) % 64, 212, 163, 115);
  });
  await savePng(sandBuf, 64, 64, path.join(tilesDir, 'tile_sand.png'));

  const grassBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 58, 37, 24);
    fillRect(0, 0, 64, 16, 39, 174, 96);
  });
  await savePng(grassBuf, 64, 64, path.join(tilesDir, 'tile_grass.png'));

  const woodBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 92, 58, 33);
    fillRect(2, 2, 60, 60, 139, 90, 43);
  });
  await savePng(woodBuf, 64, 64, path.join(tilesDir, 'tile_wood.png'));

  const rockBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 38, 23, 23);
    fillRect(0, 0, 64, 10, 192, 57, 43);
  });
  await savePng(rockBuf, 64, 64, path.join(tilesDir, 'tile_rock.png'));

  const coralStoneBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 224, 225, 229);
    fillRect(2, 2, 28, 28, 245, 247, 250);
  });
  await savePng(coralStoneBuf, 64, 64, path.join(tilesDir, 'tile_coral_stone.png'));

  const flowerPathBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 46, 204, 113);
  });
  await savePng(flowerPathBuf, 64, 64, path.join(tilesDir, 'tile_flower_path.png'));

  const cliffBrickBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 75, 85, 99);
  });
  await savePng(cliffBrickBuf, 64, 64, path.join(tilesDir, 'tile_cliff_brick.png'));

  const woodBridgeBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 60, 38, 20);
  });
  await savePng(woodBridgeBuf, 64, 64, path.join(tilesDir, 'tile_wood_bridge.png'));

  const seaBottomBuf = createRawBuffer(64, 64, ({ fillRect }) => {
    fillRect(0, 0, 64, 64, 3, 4, 94);
  });
  await savePng(seaBottomBuf, 64, 64, path.join(tilesDir, 'tile_sea_bottom.png'));

  // --- BUILDINGS & PROPS ---
  const shopBuf = createRawBuffer(220, 160, ({ fillRect }) => fillRect(0, 0, 220, 160, 240, 244, 248));
  await savePng(shopBuf, 220, 160, path.join(propsDir, 'building_shop.png'));
  const juiceBuf = createRawBuffer(200, 150, ({ fillRect }) => fillRect(0, 0, 200, 150, 139, 90, 43));
  await savePng(juiceBuf, 200, 150, path.join(propsDir, 'building_juice_bar.png'));
  const manorBuf = createRawBuffer(340, 220, ({ fillRect }) => fillRect(0, 0, 340, 220, 212, 163, 115));
  await savePng(manorBuf, 340, 220, path.join(propsDir, 'building_manor.png'));
  const castleBuf = createRawBuffer(420, 300, ({ fillRect }) => fillRect(0, 0, 420, 300, 245, 247, 250));
  await savePng(castleBuf, 420, 300, path.join(propsDir, 'building_castle.png'));
  const obsBuf = createRawBuffer(280, 260, ({ fillRect }) => fillRect(0, 0, 280, 260, 108, 117, 125));
  await savePng(obsBuf, 280, 260, path.join(propsDir, 'building_observatory.png'));
  const grandLightBuf = createRawBuffer(120, 320, ({ fillRect }) => fillRect(0, 0, 120, 320, 248, 249, 250));
  await savePng(grandLightBuf, 120, 320, path.join(propsDir, 'building_lighthouse_grand.png'));
  const tavBuf = createRawBuffer(260, 180, ({ fillRect }) => fillRect(0, 0, 260, 180, 141, 110, 99));
  await savePng(tavBuf, 260, 180, path.join(propsDir, 'building_tavern.png'));
  const hotelBuf = createRawBuffer(360, 240, ({ fillRect }) => fillRect(0, 0, 360, 240, 245, 247, 250));
  await savePng(hotelBuf, 360, 240, path.join(propsDir, 'building_hotel.png'));
  const aquaBuf = createRawBuffer(280, 190, ({ fillRect }) => fillRect(0, 0, 280, 190, 0, 119, 182));
  await savePng(aquaBuf, 280, 190, path.join(propsDir, 'building_aquarium.png'));
  const portBuf = createRawBuffer(240, 170, ({ fillRect }) => fillRect(0, 0, 240, 170, 127, 140, 141));
  await savePng(portBuf, 240, 170, path.join(propsDir, 'building_port_warehouse.png'));
  const lightBuf = createRawBuffer(90, 230, ({ fillRect }) => fillRect(0, 0, 90, 230, 248, 249, 250));
  await savePng(lightBuf, 90, 230, path.join(propsDir, 'prop_lighthouse.png'));
  const windBuf = createRawBuffer(140, 200, ({ fillRect }) => fillRect(0, 0, 140, 200, 127, 140, 141));
  await savePng(windBuf, 140, 200, path.join(propsDir, 'prop_windmill.png'));
  const clockBuf = createRawBuffer(100, 260, ({ fillRect }) => fillRect(0, 0, 100, 260, 212, 163, 115));
  await savePng(clockBuf, 100, 260, path.join(propsDir, 'prop_clocktower.png'));
  const fountainBuf = createRawBuffer(120, 110, ({ fillRect }) => fillRect(0, 0, 120, 110, 189, 195, 199));
  await savePng(fountainBuf, 120, 110, path.join(propsDir, 'prop_fountain.png'));
  const statueBuf = createRawBuffer(90, 140, ({ fillRect }) => fillRect(0, 0, 90, 140, 241, 196, 15));
  await savePng(statueBuf, 90, 140, path.join(propsDir, 'prop_statue.png'));
  const shipBuf = createRawBuffer(160, 90, ({ fillRect }) => fillRect(0, 0, 160, 90, 92, 58, 33));
  await savePng(shipBuf, 160, 90, path.join(propsDir, 'prop_ship.png'));
  const flowerArchBuf = createRawBuffer(100, 120, ({ fillRect }) => fillRect(0, 0, 100, 120, 92, 58, 33));
  await savePng(flowerArchBuf, 100, 120, path.join(propsDir, 'prop_flower_arch.png'));
  const coralReefBuf = createRawBuffer(80, 80, ({ fillRect }) => fillRect(0, 0, 80, 80, 231, 76, 60));
  await savePng(coralReefBuf, 80, 80, path.join(propsDir, 'prop_coral_reef.png'));
  const waterfallBuf = createRawBuffer(100, 300, ({ fillRect }) => fillRect(0, 0, 100, 300, 72, 202, 228));
  await savePng(waterfallBuf, 100, 300, path.join(propsDir, 'prop_waterfall.png'));
  const bridgeBuf = createRawBuffer(180, 60, ({ fillRect }) => fillRect(0, 0, 180, 60, 139, 90, 43));
  await savePng(bridgeBuf, 180, 60, path.join(propsDir, 'prop_bridge.png'));
  const cannonBuf = createRawBuffer(80, 50, ({ fillRect }) => fillRect(0, 0, 80, 50, 92, 58, 33));
  await savePng(cannonBuf, 80, 50, path.join(propsDir, 'prop_cannon.png'));
  const chestBuf = createRawBuffer(50, 40, ({ fillRect }) => fillRect(0, 0, 50, 40, 139, 90, 43));
  await savePng(chestBuf, 50, 40, path.join(propsDir, 'prop_chest.png'));
  const anchorBuf = createRawBuffer(60, 70, ({ fillRect }) => fillRect(0, 0, 60, 70, 52, 58, 64));
  await savePng(anchorBuf, 60, 70, path.join(propsDir, 'prop_anchor.png'));
  const signBuf = createRawBuffer(40, 70, ({ fillRect }) => fillRect(0, 0, 40, 70, 92, 58, 33));
  await savePng(signBuf, 40, 70, path.join(propsDir, 'prop_signpost.png'));
  const benchBuf = createRawBuffer(70, 45, ({ fillRect }) => fillRect(0, 0, 70, 45, 139, 90, 43));
  await savePng(benchBuf, 70, 45, path.join(propsDir, 'prop_bench.png'));
  const twinLampBuf = createRawBuffer(40, 100, ({ fillRect }) => fillRect(0, 0, 40, 100, 44, 62, 80));
  await savePng(twinLampBuf, 40, 100, path.join(propsDir, 'prop_streetlamp_double.png'));
  const palmBuf = createRawBuffer(130, 170, ({ fillRect }) => fillRect(0, 0, 130, 170, 39, 174, 96));
  await savePng(palmBuf, 130, 170, path.join(propsDir, 'prop_palm_tree.png'));
  const paraBuf = createRawBuffer(80, 90, ({ fillRect }) => fillRect(0, 0, 80, 90, 231, 76, 60));
  await savePng(paraBuf, 80, 90, path.join(propsDir, 'prop_parasol.png'));
  const lantBuf = createRawBuffer(30, 80, ({ fillRect }) => fillRect(0, 0, 30, 80, 255, 183, 3));
  await savePng(lantBuf, 30, 80, path.join(propsDir, 'prop_lantern.png'));
  const boatBuf = createRawBuffer(80, 35, ({ fillRect }) => fillRect(0, 0, 80, 35, 141, 110, 99));
  await savePng(boatBuf, 80, 35, path.join(propsDir, 'prop_boat.png'));

  // --- 128x128 FACE PORTRAITS ---
  const liriaPortBuf = createRawBuffer(128, 128, ({ fillCircle, fillRect, setPixel }) => {
    fillCircle(64, 64, 60, 255, 107, 129);
    fillCircle(64, 68, 42, 255, 209, 179);
    fillCircle(46, 66, 7, 46, 204, 113);
    fillCircle(82, 66, 7, 46, 204, 113);
    setPixel(48, 64, 255, 255, 255);
    setPixel(84, 64, 255, 255, 255);
    fillCircle(40, 78, 8, 255, 133, 162);
    fillCircle(88, 78, 8, 255, 133, 162);
    fillRect(56, 84, 16, 6, 235, 77, 75);
    fillCircle(95, 40, 14, 241, 196, 15);
  });
  await savePng(liriaPortBuf, 128, 128, path.join(portraitsDir, 'portrait_liria.png'));

  const petePortBuf = createRawBuffer(128, 128, ({ fillCircle, fillRect }) => {
    fillCircle(64, 64, 60, 27, 20, 100);
    fillCircle(64, 64, 40, 230, 184, 156);
    fillCircle(64, 88, 32, 245, 246, 250);
    fillRect(24, 24, 80, 28, 27, 20, 100);
    fillRect(20, 48, 88, 10, 241, 196, 15);
    fillCircle(64, 38, 8, 241, 196, 15);
    fillCircle(48, 60, 5, 44, 62, 80);
    fillCircle(80, 60, 5, 44, 62, 80);
  });
  await savePng(petePortBuf, 128, 128, path.join(portraitsDir, 'portrait_pete.png'));

  const kaelPortBuf = createRawBuffer(128, 128, ({ fillCircle, fillRect }) => {
    fillCircle(64, 64, 60, 24, 44, 97);
    fillCircle(64, 68, 42, 217, 155, 115);
    fillRect(20, 20, 88, 24, 235, 77, 75);
    fillCircle(46, 64, 9, 47, 54, 64);
    fillRect(35, 62, 60, 4, 47, 54, 64);
    fillCircle(82, 64, 7, 0, 210, 211);
    fillRect(56, 86, 18, 4, 120, 60, 30);
  });
  await savePng(kaelPortBuf, 128, 128, path.join(portraitsDir, 'portrait_kael.png'));

  const carlPortBuf = createRawBuffer(128, 128, ({ fillCircle, fillRect }) => {
    fillCircle(64, 64, 60, 241, 196, 15);
    fillCircle(64, 68, 42, 229, 169, 117);
    fillRect(24, 30, 80, 40, 241, 196, 15);
    fillCircle(64, 38, 8, 231, 76, 60);
    fillCircle(46, 64, 7, 230, 126, 34);
    fillCircle(82, 64, 7, 230, 126, 34);
    fillRect(50, 86, 28, 6, 192, 57, 43);
  });
  await savePng(carlPortBuf, 128, 128, path.join(portraitsDir, 'portrait_wrestler_king.png'));

  const orionPortBuf = createRawBuffer(128, 128, ({ fillCircle, fillRect }) => {
    fillCircle(64, 64, 60, 12, 36, 97);
    fillCircle(64, 64, 48, 24, 44, 97);
    fillCircle(64, 70, 36, 245, 230, 202);
    fillCircle(46, 66, 12, 241, 196, 15);
    fillCircle(46, 66, 9, 116, 185, 255);
    fillCircle(82, 66, 12, 241, 196, 15);
    fillCircle(82, 66, 9, 116, 185, 255);
    fillRect(56, 64, 16, 4, 241, 196, 15);
  });
  await savePng(orionPortBuf, 128, 128, path.join(portraitsDir, 'portrait_astronomer.png'));

  const lunaPortBuf = createRawBuffer(128, 128, ({ fillCircle, fillRect, setPixel }) => {
    fillCircle(64, 64, 60, 108, 92, 231);
    fillCircle(64, 68, 40, 255, 234, 167);
    fillCircle(46, 66, 7, 162, 155, 254);
    fillCircle(82, 66, 7, 162, 155, 254);
    setPixel(48, 64, 255, 255, 255);
    setPixel(84, 64, 255, 255, 255);
    fillRect(56, 84, 16, 5, 255, 118, 117);
    fillCircle(30, 44, 10, 254, 202, 87);
  });
  await savePng(lunaPortBuf, 128, 128, path.join(portraitsDir, 'portrait_luna.png'));

  // ====================================================
  // 🌟 NEW: MATCHING FULL-BODY FIELD NPC SPRITES (90x115px)
  // ====================================================

  // 1. Field NPC: Liria (Pink Hair, Hibiscus Flower, Emerald Green Dress)
  const nLiriaBuf = createRawBuffer(90, 115, ({ fillCircle, fillRect }) => {
    // Body / Dress
    fillRect(25, 45, 40, 50, 46, 204, 113); // Emerald Dress
    fillRect(35, 45, 20, 50, 248, 249, 250); // White Apron
    // Legs & Shoes
    fillRect(32, 95, 10, 15, 255, 209, 179);
    fillRect(48, 95, 10, 15, 255, 209, 179);
    fillRect(30, 106, 13, 8, 235, 77, 75);
    fillRect(47, 106, 13, 8, 235, 77, 75);
    // Face & Head
    fillCircle(45, 28, 20, 255, 209, 179);
    fillCircle(45, 22, 22, 255, 107, 129); // Coral Pink Hair
    fillCircle(62, 14, 7, 241, 196, 15);   // Hibiscus Flower
    // Eyes
    fillCircle(38, 28, 3, 46, 204, 113);
    fillCircle(52, 28, 3, 46, 204, 113);
  });
  await savePng(nLiriaBuf, 90, 115, path.join(npcsDir, 'npc_liria.png'));

  // 2. Field NPC: Pete (Captain Cap, White Beard, Navy Coat)
  const nPeteBuf = createRawBuffer(90, 115, ({ fillCircle, fillRect }) => {
    // Navy Coat
    fillRect(22, 45, 46, 52, 27, 20, 100);
    fillRect(42, 45, 6, 52, 241, 196, 15);  // Gold Buttons
    // Legs & Boots
    fillRect(30, 97, 12, 14, 44, 62, 80);
    fillRect(48, 97, 12, 14, 44, 62, 80);
    // Face & Beard
    fillCircle(45, 28, 18, 230, 184, 156);
    fillCircle(45, 38, 16, 245, 246, 250); // White Beard
    // Captain's Cap
    fillRect(20, 8, 50, 18, 27, 20, 100);
    fillRect(16, 22, 58, 6, 241, 196, 15);  // Gold Visor
    fillCircle(45, 14, 5, 241, 196, 15);   // Gold Anchor
  });
  await savePng(nPeteBuf, 90, 115, path.join(npcsDir, 'npc_pete.png'));

  // 3. Field NPC: Kael (Red Bandana, Eye Patch, Sailor Vest)
  const nKaelBuf = createRawBuffer(90, 115, ({ fillCircle, fillRect }) => {
    // Vest & Pants
    fillRect(25, 45, 40, 30, 24, 44, 97);  // Navy Sailor Vest
    fillRect(30, 75, 30, 22, 236, 240, 241); // Striped Pants
    fillRect(28, 97, 13, 14, 120, 60, 30);  // Brown Boots
    fillRect(49, 97, 13, 14, 120, 60, 30);
    // Face & Head
    fillCircle(45, 28, 19, 217, 155, 115);
    fillRect(20, 10, 50, 14, 235, 77, 75);  // Red Bandana
    // Eye Patch
    fillCircle(38, 26, 5, 47, 54, 64);
    fillCircle(52, 26, 3, 0, 210, 211);     // Cyan Eye
  });
  await savePng(nKaelBuf, 90, 115, path.join(npcsDir, 'npc_kael.png'));

  // 4. Field NPC: Champion Carl (Golden Mask, Red Gem, Gold Belt)
  const nCarlBuf = createRawBuffer(90, 115, ({ fillCircle, fillRect }) => {
    // Muscular Body & Belt
    fillRect(24, 42, 42, 35, 229, 169, 117); // Muscular Tan Torso
    fillRect(22, 72, 46, 12, 241, 196, 15); // Champion Gold Belt
    fillCircle(45, 78, 6, 231, 76, 60);     // Belt Gem
    fillRect(28, 84, 14, 26, 231, 76, 60);  // Red Wrestling Trunks & Boots
    fillRect(48, 84, 14, 26, 231, 76, 60);
    // Head & Golden Mask
    fillCircle(45, 26, 18, 229, 169, 117);
    fillRect(25, 10, 40, 22, 241, 196, 15); // Golden Mask
    fillCircle(45, 15, 5, 231, 76, 60);    // Crown Gem
  });
  await savePng(nCarlBuf, 90, 115, path.join(npcsDir, 'npc_wrestler_king.png'));

  // 5. Field NPC: Astronomer Orion (Star Hood, Robe, Glasses)
  const nOrionBuf = createRawBuffer(90, 115, ({ fillCircle, fillRect }) => {
    // Robe
    fillRect(22, 42, 46, 56, 12, 36, 97);   // Royal Blue Robe
    fillRect(42, 42, 6, 56, 241, 196, 15);  // Gold Trim
    // Face & Hood
    fillCircle(45, 26, 18, 245, 230, 202);
    fillCircle(45, 22, 22, 24, 44, 97);    // Blue Hood
    // Glasses
    fillCircle(38, 26, 5, 241, 196, 15);
    fillCircle(52, 26, 5, 241, 196, 15);
  });
  await savePng(nOrionBuf, 90, 115, path.join(npcsDir, 'npc_astronomer.png'));

  // 6. Field NPC: Luna (Violet Hair, Manager Vest & Skirt)
  const nLunaBuf = createRawBuffer(90, 115, ({ fillCircle, fillRect }) => {
    // Manager Suit & Skirt
    fillRect(26, 44, 38, 28, 108, 92, 231); // Violet Vest
    fillRect(28, 72, 34, 22, 248, 249, 250); // White Skirt
    fillRect(32, 94, 10, 16, 44, 62, 80);   // Heels
    fillRect(48, 94, 10, 16, 44, 62, 80);
    // Face & Hair
    fillCircle(45, 26, 18, 255, 234, 167);
    fillCircle(45, 20, 21, 108, 92, 231);  // Violet Hair
    fillCircle(60, 16, 5, 254, 202, 87);   // Gold Hairpin
  });
  await savePng(nLunaBuf, 90, 115, path.join(npcsDir, 'npc_luna.png'));

  console.log('[AssetGen] All Mega Metropolis PNG Assets, Face Portraits & Field NPC Sprites successfully generated!');
}

generateAllAssets().catch(err => {
  console.error('[AssetGen] Error:', err);
  process.exit(1);
});
