export class SpriteManager {
  constructor() {
    this.animTime = 0;

    // Load Transparent Sprite Assets
    this.assets = {
      player: new Image(),
      portal: new Image(),
      slime: new Image()
    };

    this.assets.player.src = '/assets/player.png';
    this.assets.portal.src = '/assets/portal.png';
    this.assets.slime.src = '/assets/slime.png';
  }

  update(dt) {
    this.animTime += dt;
  }

  // Draw Player Character with Modular Paperdoll System
  drawPlayer(ctx, p, isLocal) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);

    const bob = Math.sin(this.animTime * 8) * (p.animState === 'walk' ? 4 : 2);

    // Player Shadow (scaled for larger character)
    ctx.save();
    ctx.scale(p.facing, 1); // unflip shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isLocal) {
      // Local player arrow indicator
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(0, -95 + Math.sin(this.animTime * 10) * 3);
      ctx.lineTo(-7, -107 + Math.sin(this.animTime * 10) * 3);
      ctx.lineTo(7, -107 + Math.sin(this.animTime * 10) * 3);
      ctx.closePath();
      ctx.fill();
    }

    // Player Nickname Above Head (Dynamic Width)
    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(p.nickname || '모험가').width;
    const padding = 16;
    const boxWidth = textWidth + padding;

    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fillRect(-boxWidth / 2, -90, boxWidth, 20);
    ctx.strokeStyle = isLocal ? 'rgba(255, 209, 102, 0.6)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-boxWidth / 2, -90, boxWidth, 20);

    ctx.fillStyle = isLocal ? '#ffd166' : '#ffffff';
    ctx.fillText(p.nickname || '모험가', 0, -75);
    ctx.restore();

    // Modular Layered Character (Scale 1.45x for larger, hero-like proportions)
    this.drawCharacterBody(ctx, p, bob);

    ctx.restore();
  }

  drawCharacterBody(ctx, p, bob) {
    ctx.save();
    // Scale player up for clear, crisp visibility
    ctx.scale(1.45, 1.45);

    // Default modular equipment if not specified
    const equip = p.equipment || {
      hat: 'knight_helm',
      top: 'knight_plate',
      bottom: 'steel_pants',
      weapon: 'magic_sword'
    };

    // If full composite sprite exists and equipment is default, offer option or render paperdoll
    const img = this.assets.player;
    if (p.useCompositeImage && img.complete && img.naturalWidth !== 0) {
      if (p.animState === 'walk') {
        ctx.rotate(Math.sin(this.animTime * 12) * 0.08);
      }
      ctx.drawImage(img, -28, -52 + bob, 56, 56);
      ctx.restore();
      return;
    }

    // --- MODULAR PAPERDOLL LAYER RENDERING SYSTEM ---
    // Layer 1: Base Body & Head Skin
    this.drawLayerSkin(ctx, p, bob);

    // Layer 2: Legs & Bottom Armor (Pants/Boots)
    this.drawLayerBottom(ctx, equip.bottom || 'steel_pants', p, bob);

    // Layer 3: Chest / Top Armor
    this.drawLayerTop(ctx, equip.top || 'knight_plate', p, bob);

    // Layer 4: Head & Helmet / Hat
    this.drawLayerHat(ctx, equip.hat || 'knight_helm', p, bob);

    // Layer 5: Arm & Weapon
    this.drawLayerWeapon(ctx, equip.weapon || 'magic_sword', p, bob);

    ctx.restore();
  }

  // --- PAPERDOLL COMPONENT LAYERS ---

  // 1. Skin & Anatomy Base
  drawLayerSkin(ctx, p, bob) {
    // Neck
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(-3, -26 + bob, 6, 6);

    // Head Base Skin
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Eye Detail
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(4, -34 + bob, 3, 4);
  }

  // 2. Bottom Slot (Pants, Greaves, Boots)
  drawLayerBottom(ctx, style, p, bob) {
    const legOffset = p.animState === 'walk' ? Math.sin(this.animTime * 12) * 6 : 0;

    if (style === 'dark_pants') {
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-8 + legOffset, -12 + bob, 6, 12);
      ctx.fillRect(2 - legOffset, -12 + bob, 6, 12);
      // Boots
      ctx.fillStyle = '#485460';
      ctx.fillRect(-9 + legOffset, -2 + bob, 8, 4);
      ctx.fillRect(1 - legOffset, -2 + bob, 8, 4);
    } else if (style === 'royal_pants') {
      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(-8 + legOffset, -12 + bob, 6, 12);
      ctx.fillRect(2 - legOffset, -12 + bob, 6, 12);
      // Gold boots
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-9 + legOffset, -2 + bob, 8, 4);
      ctx.fillRect(1 - legOffset, -2 + bob, 8, 4);
    } else {
      // Default: steel_pants
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-8 + legOffset, -12 + bob, 6, 12);
      ctx.fillRect(2 - legOffset, -12 + bob, 6, 12);
      // Steel Greaves
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-9 + legOffset, -4 + bob, 8, 5);
      ctx.fillRect(1 - legOffset, -4 + bob, 8, 5);
    }
  }

  // 3. Top Slot (Chestplate, Tunics, Robes)
  drawLayerTop(ctx, style, p, bob) {
    if (style === 'royal_coat') {
      // Red Tunic Coat
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-10, -25 + bob, 20, 16);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-2, -23 + bob, 4, 12);
    } else if (style === 'golden_armor') {
      // Gold Armor
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-11, -26 + bob, 22, 17);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-8, -24 + bob, 16, 13);
      // Gem Centerpiece
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-3, -20 + bob, 6, 6);
    } else {
      // Default: knight_plate
      ctx.fillStyle = '#1a252f';
      ctx.fillRect(-11, -26 + bob, 22, 17);
      // Steel Chestplate
      ctx.fillStyle = '#34495e';
      ctx.fillRect(-9, -24 + bob, 18, 13);
      // Glowing Core Emblem
      ctx.fillStyle = '#3498db';
      ctx.fillRect(-4, -20 + bob, 8, 6);
      // Pauldrons (Shoulders)
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-13, -26 + bob, 4, 8);
      ctx.fillRect(9, -26 + bob, 4, 8);
    }
  }

  // 4. Hat Slot (Helmets, Crowns, Caps)
  drawLayerHat(ctx, style, p, bob) {
    if (style === 'crown') {
      // Royal Crown
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-9, -40 + bob, 18, 8);
      ctx.beginPath();
      ctx.moveTo(-9, -40 + bob);
      ctx.lineTo(-9, -46 + bob);
      ctx.lineTo(-4, -41 + bob);
      ctx.lineTo(0, -47 + bob);
      ctx.lineTo(4, -41 + bob);
      ctx.lineTo(9, -46 + bob);
      ctx.lineTo(9, -40 + bob);
      ctx.fill();
      // Rubies
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-1, -43 + bob, 2, 2);
    } else if (style === 'wizard_hat') {
      // Wizard Pointy Hat
      ctx.fillStyle = '#4b6584';
      ctx.beginPath();
      ctx.moveTo(0, -56 + bob);
      ctx.lineTo(-12, -36 + bob);
      ctx.lineTo(12, -36 + bob);
      ctx.closePath();
      ctx.fill();
      // Brim
      ctx.fillStyle = '#264367';
      ctx.fillRect(-15, -37 + bob, 30, 4);
    } else if (style === 'none') {
      // Hair
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.arc(0, -34 + bob, 12, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      // Default: knight_helm
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(0, -34 + bob, 12, 0, Math.PI * 2);
      ctx.fill();

      // Visor Slot Glow
      ctx.fillStyle = '#111111';
      ctx.fillRect(1, -36 + bob, 10, 5);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(3, -35 + bob, 7, 3);

      // Red Plume Feather Top
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(-2, -45 + bob);
      ctx.quadraticCurveTo(-10, -52 + bob, -4, -54 + bob);
      ctx.quadraticCurveTo(0, -50 + bob, 2, -45 + bob);
      ctx.fill();
    }
  }

  // 5. Weapon Slot (Swords, Axes, Spears, Magic Staffs)
  drawLayerWeapon(ctx, style, p, bob) {
    ctx.save();
    // Arm angle with swing animation
    const armAngle = p.animState === 'walk' ? Math.sin(this.animTime * 10) * 0.15 : 0;
    ctx.translate(6, -20 + bob);
    ctx.rotate(armAngle);

    // Front Arm Skin / Glove
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-2, -2, 6, 10);

    if (style === 'fire_blade') {
      // Flaming Broadsword
      ctx.fillStyle = '#d35400';
      ctx.fillRect(3, -6, 5, 4);
      ctx.fillRect(1, -22, 6, 17);
      // Flame Aura
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(2, -26, 4, 6);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(0, -18, 2, 10);
    } else if (style === 'golden_spear') {
      // Holy Spear
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(3, -35, 2, 45);
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(4, -45);
      ctx.lineTo(0, -35);
      ctx.lineTo(8, -35);
      ctx.closePath();
      ctx.fill();
    } else {
      // Default: magic_sword (Glowing Crystal Longsword)
      ctx.fillStyle = '#f1c40f'; // Gold Hilt
      ctx.fillRect(2, -4, 6, 3);
      ctx.fillRect(4, -1, 2, 6);

      // Glowing Cyan Blade
      ctx.fillStyle = '#00d2d3';
      ctx.fillRect(3, -24, 4, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -22, 2, 17);

      // Energy Particles
      const particleY = -10 - Math.sin(this.animTime * 15) * 10;
      ctx.fillStyle = '#54a0ff';
      ctx.fillRect(7, particleY, 3, 3);
    }

    ctx.restore();
  }

  // Draw Animated Portal with PNG asset
  drawPortal(ctx, portal) {
    ctx.save();
    ctx.translate(portal.x, portal.y - 45);

    const rotation = this.animTime * 1.5;
    const scalePulse = 1 + Math.sin(this.animTime * 4) * 0.06;

    ctx.scale(scalePulse, scalePulse);

    // Outer Glow Circle
    ctx.fillStyle = 'rgba(88, 101, 242, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Portal Magic Ring
    ctx.save();
    ctx.rotate(rotation);
    ctx.strokeStyle = '#5865f2';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw Transparent Portal Sprite Asset
    const pImg = this.assets.portal;
    if (pImg.complete && pImg.naturalWidth !== 0) {
      ctx.drawImage(pImg, -32, -40, 64, 80);
    } else {
      // Core Radial Orb fallback
      const coreGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.5, '#74b9ff');
      coreGradient.addColorStop(1, '#0984e3');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Portal Destination Label Tag
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fillRect(-55, -54, 110, 18);
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.6)';
    ctx.strokeRect(-55, -54, 110, 18);
    ctx.fillStyle = '#a29bfe';
    ctx.fillText(portal.label || '포탈 [W]', 0, -41);

    ctx.restore();
  }

  // Draw Mob / Slime Monster
  drawMob(ctx, mob) {
    ctx.save();
    ctx.translate(mob.x, mob.y);

    const squish = Math.sin(this.animTime * 10) * 0.08;
    ctx.scale(1 + squish, 1 - squish);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const mobImg = this.assets.slime;
    if (mobImg.complete && mobImg.naturalWidth !== 0) {
      ctx.drawImage(mobImg, -20, -32, 40, 36);
    } else {
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(0, -14, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw NPC Character & Name / Prompt Tag & Quest Marks
  drawNPC(ctx, npc, isNearby, questStatus = null) {
    ctx.save();
    ctx.translate(npc.x, npc.y);

    const idleBob = Math.sin(this.animTime * 3) * 3;
    const now = Date.now();

    // 1. Ground Magic Aura Halo
    const haloGlow = Math.sin(this.animTime * 4) * 0.15 + 0.85;
    const haloGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
    haloGrad.addColorStop(0, 'rgba(0, 210, 211, 0.5)');
    haloGrad.addColorStop(0.6, 'rgba(0, 210, 211, 0.15)');
    haloGrad.addColorStop(1, 'rgba(0, 210, 211, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36 * haloGlow, 12 * haloGlow, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Detail Fantasy Character Rendering
    ctx.save();
    ctx.translate(0, idleBob);

    if (npc.type === 'fairy') {
      // 🧚‍♀️ Animated Fairy Wing & Magic Wand
      const wingSway = Math.sin(this.animTime * 12) * 0.25;
      
      // Translucent Wings
      ctx.fillStyle = 'rgba(160, 241, 255, 0.65)';
      ctx.save();
      ctx.rotate(-0.2 + wingSway);
      ctx.beginPath();
      ctx.ellipse(-24, -55, 22, 10, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(0.2 - wingSway);
      ctx.beginPath();
      ctx.ellipse(24, -55, 22, 10, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fairy Body Tunic
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-10, -42, 20, 26);
      ctx.fillStyle = '#ab47bc';
      ctx.fillRect(-12, -45, 24, 8);

      // Head Skin & Flower Crown
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(0, -56, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff7675';
      ctx.fillRect(-10, -66, 20, 4);

      // Magic Wand
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(12, -62, 3, 30);
      ctx.beginPath();
      ctx.arc(13.5, -64, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (npc.type === 'knight') {
      // ⚔️ Knight Champion Armor & Swaying Cape
      const capeSway = Math.sin(this.animTime * 3) * 6;
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-14, -52);
      ctx.lineTo(-24 + capeSway, -10);
      ctx.lineTo(24 + capeSway, -10);
      ctx.lineTo(14, -52);
      ctx.closePath();
      ctx.fill();

      // Steel Plate Armor
      ctx.fillStyle = '#34495e';
      ctx.fillRect(-14, -50, 28, 30);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-4, -46, 8, 20);

      // Helmet
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-12, -72, 24, 22);
      ctx.fillStyle = '#111';
      ctx.fillRect(-8, -64, 16, 4);

    } else if (npc.type === 'alchemist') {
      // 🌋 Lava Alchemist / Dwarf
      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(-14, -40, 28, 24);
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-16, -42, 32, 6);

      // Goggles Head
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(0, -50, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-8, -54, 16, 5);

    } else {
      // Default Town NPC Sprite Image Preloading
      if (!this.npcFieldSprites) this.npcFieldSprites = {};
      const spritePath = npc.fieldSprite || npc.portrait || '/assets/portraits/portrait_liria.png';
      if (!this.npcFieldSprites[npc.id]) {
        const img = new Image();
        img.src = spritePath;
        this.npcFieldSprites[npc.id] = img;
      }

      const npcImg = this.npcFieldSprites[npc.id];
      if (npcImg.complete && npcImg.naturalWidth !== 0) {
        ctx.drawImage(npcImg, -45, -112, 90, 115);
      } else {
        // High-detail default adventurer fallback
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(-12, -45, 24, 28);
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, -55, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 3. Quest Status Mark Badges Overhead ('!' or '?')
    if (questStatus) {
      const qBob = Math.sin(this.animTime * 8) * 4;
      ctx.save();
      ctx.translate(0, -95 + idleBob + qBob);

      if (questStatus === 'available') {
        // Amber Glowing '!' Badge
        ctx.fillStyle = 'rgba(255, 170, 0, 0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'black 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, 5);

      } else if (questStatus === 'canComplete') {
        // Green Glowing '?' Badge
        ctx.fillStyle = 'rgba(46, 204, 113, 0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 5);
      }
      ctx.restore();
    }

    // 4. Name Tag Box
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    
    const tagW = 140;
    const tagH = 20;
    const tagY = -124 + idleBob;

    ctx.fillStyle = 'rgba(12, 18, 30, 0.92)';
    ctx.fillRect(-tagW / 2, tagY, tagW, tagH);
    ctx.strokeStyle = isNearby ? '#00d2d3' : 'rgba(0, 210, 211, 0.4)';
    ctx.lineWidth = isNearby ? 2 : 1;
    ctx.strokeRect(-tagW / 2, tagY, tagW, tagH);

    ctx.fillStyle = '#00d2d3';
    ctx.fillText(npc.name || 'NPC', 0, tagY + 14);

    // Nearby Interaction Prompt [Space: 대화]
    if (isNearby) {
      const promptPulse = Math.sin(this.animTime * 8) * 0.1;
      ctx.save();
      ctx.translate(0, tagY - 14);
      ctx.scale(1 + promptPulse, 1 + promptPulse);

      ctx.fillStyle = 'rgba(255, 170, 0, 0.95)';
      ctx.fillRect(-45, -9, 90, 16);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-45, -9, 90, 16);

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 10px "Noto Sans KR", sans-serif';
      ctx.fillText('💬 [Space] 대화', 0, 3);
      ctx.restore();
    }

    ctx.restore();
  }


  // ----------------------------------------------------
  // 🏝️ CORAL ISLAND TOWN GRAPHICS RENDERERS
  // ----------------------------------------------------

  // 1. Town Landmarks (Lighthouse, Windmill, Pavilion)
  drawTownLandmark(ctx, lm) {
    ctx.save();
    ctx.translate(lm.x, lm.y);

    if (lm.type === 'lighthouse') {
      // Base shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Lighthouse Tower (Conical tapered structure)
      const towerHeight = 220;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(-20, -towerHeight);
      ctx.lineTo(20, -towerHeight);
      ctx.lineTo(35, 0);
      ctx.closePath();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();

      // Red Coral Stripe Bands
      const stripeHeights = [
        { y1: -40, y2: -80 },
        { y1: -120, y2: -160 }
      ];
      stripeHeights.forEach(s => {
        ctx.beginPath();
        const topRatio1 = (towerHeight + s.y1) / towerHeight;
        const topRatio2 = (towerHeight + s.y2) / towerHeight;
        const w1 = 20 + (35 - 20) * topRatio1;
        const w2 = 20 + (35 - 20) * topRatio2;
        ctx.moveTo(-w1, s.y1);
        ctx.lineTo(-w2, s.y2);
        ctx.lineTo(w2, s.y2);
        ctx.lineTo(w1, s.y1);
        ctx.closePath();
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
      });

      // Top Glass Lamp Chamber Platform & Railing
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-28, -towerHeight - 8, 56, 8);
      ctx.fillRect(-22, -towerHeight - 40, 44, 32);

      // Glass Glow Window
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-16, -towerHeight - 34, 32, 22);

      // Conical Roof Peak
      ctx.beginPath();
      ctx.moveTo(0, -towerHeight - 65);
      ctx.lineTo(-26, -towerHeight - 40);
      ctx.lineTo(26, -towerHeight - 40);
      ctx.closePath();
      ctx.fillStyle = '#c0392b';
      ctx.fill();

      // Rotating Light Beam Effect
      const beamAngle = this.animTime * 1.2;
      ctx.save();
      ctx.translate(0, -towerHeight - 23);
      ctx.rotate(beamAngle);
      const lightGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 180);
      lightGrad.addColorStop(0, 'rgba(255, 241, 118, 0.8)');
      lightGrad.addColorStop(0.4, 'rgba(255, 235, 59, 0.35)');
      lightGrad.addColorStop(1, 'rgba(255, 235, 59, 0)');

      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 180, -0.25, 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

    } else if (lm.type === 'windmill') {
      // Base Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Windmill Stone Base Tower
      const h = 170;
      ctx.beginPath();
      ctx.moveTo(-32, 0);
      ctx.lineTo(-18, -h);
      ctx.lineTo(18, -h);
      ctx.lineTo(32, 0);
      ctx.closePath();
      ctx.fillStyle = '#7f8c8d';
      ctx.fill();

      // Stone Bricks Overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(-22, -120, 44, 6);
      ctx.fillRect(-26, -60, 52, 6);

      // Wooden Door & Window
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(-8, -35, 16, 35);
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(-6, -110, 12, 16);

      // Roof Dome
      ctx.beginPath();
      ctx.arc(0, -h, 22, Math.PI, 0);
      ctx.fillStyle = '#d35400';
      ctx.fill();

      // Rotating Wooden Windmill Blades
      const bladeAngle = this.animTime * 0.8;
      ctx.save();
      ctx.translate(0, -h + 5);
      ctx.rotate(bladeAngle);

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // 4 Sail Blades
      ctx.fillStyle = '#ecf0f1';
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2;

      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        ctx.fillRect(4, -6, 75, 18);
        ctx.strokeRect(4, -6, 75, 18);
        ctx.restore();
      }
      ctx.restore();

    } else if (lm.type === 'pavilion') {
      // Coastal Lookout Pavilion
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-65, -8, 130, 8);
      // Support Pillars
      ctx.fillRect(-55, -90, 10, 82);
      ctx.fillRect(45, -90, 10, 82);
      // Thatched Roof
      ctx.beginPath();
      ctx.moveTo(0, -135);
      ctx.lineTo(-75, -88);
      ctx.lineTo(75, -88);
      ctx.closePath();
      ctx.fillStyle = '#e9c46a';
      ctx.fill();
    }

    // Name Label Tag
    if (lm.label) {
      ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10, 20, 35, 0.85)';
      ctx.fillRect(-60, -245, 120, 18);
      ctx.strokeStyle = 'rgba(0, 210, 211, 0.5)';
      ctx.strokeRect(-60, -245, 120, 18);
      ctx.fillStyle = '#00d2d3';
      ctx.fillText(lm.label, 0, -232);
    }

    ctx.restore();
  }

  // 2. Town Buildings (Blue-roofed Shops, Juice Bar, Manor)
  drawTownBuilding(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);

    const w = b.width || 200;
    const h = b.height || 150;

    // Building Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-w / 2 + 5, 0, w - 10, 8);

    if (b.type === 'blue_roof_shop') {
      // Mediterranean White Stucco Walls
      const wallGrad = ctx.createLinearGradient(0, -h, 0, 0);
      wallGrad.addColorStop(0, '#ffffff');
      wallGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(-w / 2, -h + 35, w, h - 35);

      // Deep Blue Coastal Tiled Roof
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 15, -h + 40);
      ctx.lineTo(-w / 2 + 10, -h);
      ctx.lineTo(w / 2 - 10, -h);
      ctx.lineTo(w / 2 + 15, -h + 40);
      ctx.closePath();
      ctx.fillStyle = '#0077b6';
      ctx.fill();

      ctx.fillStyle = '#0096c7';
      ctx.fillRect(-w / 2 - 15, -h + 35, w + 30, 8);

      // Arched Wooden Door
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.arc(0, -35, 16, Math.PI, 0);
      ctx.fillRect(-16, -35, 32, 35);
      ctx.fill();

      // Windows with Warm Interior Light Glow
      const winW = 32;
      const winH = 42;
      [-w / 3, w / 3].forEach(wx => {
        ctx.fillStyle = '#2b2d42';
        ctx.fillRect(wx - winW / 2, -h + 60, winW, winH);

        // Glass Glow
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(wx - winW / 2 + 3, -h + 63, winW - 6, winH - 6);

        // Window Frame Lines
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 1, -h + 60, 2, winH);
        ctx.fillRect(wx - winW / 2, -h + 80, winW, 2);
      });

      // Striped Shop Awning
      const awnY = -h + 105;
      for (let x = -w / 2 + 10; x < w / 2 - 10; x += 20) {
        ctx.fillStyle = (Math.floor(x / 20) % 2 === 0) ? '#e74c3c' : '#ffffff';
        ctx.fillRect(x, awnY, 20, 15);
      }

    } else if (b.type === 'juice_bar') {
      // Tropical Open Beach Bar Hut
      // Wooden Counter
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(-w / 2, -50, w, 50);

      ctx.fillStyle = '#cd853f';
      ctx.fillRect(-w / 2 - 8, -55, w + 16, 8);

      // Thatched Roof Posts
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-w / 2 + 10, -h, 12, h);
      ctx.fillRect(w / 2 - 22, -h, 12, h);

      // Tropical Straw Thatched Roof
      ctx.beginPath();
      ctx.moveTo(0, -h - 25);
      ctx.lineTo(-w / 2 - 25, -h + 15);
      ctx.lineTo(w / 2 + 25, -h + 15);
      ctx.closePath();
      ctx.fillStyle = '#e9c46a';
      ctx.fill();

      // Coconut Drinks & Cups on Bar
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(-30, -70, 10, 15);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(10, -70, 10, 15);

    } else if (b.type === 'manor') {
      // Mayor Pete's Grand Stone Manor
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(-w / 2, -h + 40, w, h - 40);

      // Terracotta Roof
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 20, -h + 45);
      ctx.lineTo(0, -h - 15);
      ctx.lineTo(w / 2 + 20, -h + 45);
      ctx.closePath();
      ctx.fillStyle = '#b23b18';
      ctx.fill();

      // Double Arched Manor Door
      ctx.fillStyle = '#3a2312';
      ctx.fillRect(-22, -60, 44, 60);

      // Balcony Railing
      ctx.fillStyle = '#111';
      ctx.fillRect(-w / 2 + 30, -h + 100, w - 60, 8);
    }

    // Signboard Label Tag Above Building
    if (b.label) {
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.fillRect(-70, -h - 20, 140, 20);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
      ctx.strokeRect(-70, -h - 20, 140, 20);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(b.label, 0, -h - 6);
    }

    ctx.restore();
  }

  // 3. Tropical Palm Trees
  drawPalmTree(ctx, tree) {
    ctx.save();
    ctx.translate(tree.x, tree.y);
    const scale = tree.scale || 1.0;
    ctx.scale(scale, scale);

    // Tree Trunk (Curved Textured Brown)
    ctx.strokeStyle = '#6e4726';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(15, -60, 5, -130);
    ctx.stroke();

    // Trunk Ring Segments
    ctx.strokeStyle = '#422813';
    ctx.lineWidth = 14;
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(15, -60, 5, -130);
    ctx.stroke();
    ctx.setLineDash([]);

    // Palm Tree Top Center
    const topX = 5;
    const topY = -130;
    const sway = Math.sin(this.animTime * 2 + tree.x) * 0.08;

    // Coconuts
    ctx.fillStyle = '#3e2714';
    ctx.beginPath();
    ctx.arc(topX - 5, topY + 6, 6, 0, Math.PI * 2);
    ctx.arc(topX + 5, topY + 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Palm Fronds (6 Broad Leaves)
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(sway);

    const leafColors = ['#27ae60', '#2ecc71', '#1e8449'];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.save();
      ctx.rotate(angle);

      ctx.fillStyle = leafColors[i % 3];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(35, -25, 75, 10);
      ctx.quadraticCurveTo(35, 10, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  // 4. Beach & Town Decorations (Parasols, Boats, Flowerbeds, Signboards)
  drawTownDecoration(ctx, dec) {
    ctx.save();
    ctx.translate(dec.x, dec.y);

    if (dec.type === 'parasol') {
      // Beach Umbrella & Lounge Chair
      ctx.fillStyle = '#607d8b';
      ctx.fillRect(10, -18, 35, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, -22, 12, 18);

      // Wooden Umbrella Pole
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-2, -75, 4, 75);

      // Striped Umbrella Canopy
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(-45, -70);
      ctx.lineTo(45, -70);
      ctx.closePath();
      ctx.fillStyle = '#e74c3c';
      ctx.fill();

      // White Stripe Overlay
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(-15, -70);
      ctx.lineTo(15, -70);
      ctx.closePath();
      ctx.fill();

    } else if (dec.type === 'boat') {
      // Small Wooden Pier Boat
      const floatY = Math.sin(this.animTime * 3) * 3;
      ctx.translate(0, floatY);

      ctx.beginPath();
      ctx.moveTo(-45, -15);
      ctx.lineTo(45, -15);
      ctx.lineTo(30, 10);
      ctx.lineTo(-30, 10);
      ctx.closePath();
      ctx.fillStyle = '#8d6e63';
      ctx.fill();
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (dec.type === 'signboard') {
      // Wooden Welcome Sign Post
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-4, -55, 8, 55);

      ctx.fillStyle = '#a07855';
      ctx.fillRect(-65, -55, 130, 32);
      ctx.strokeStyle = '#3a2312';
      ctx.strokeRect(-65, -55, 130, 32);

      ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fefae0';
      ctx.fillText(dec.title || '마을 표지판', 0, -35);

    } else if (dec.type === 'flowerbed') {
      // Garden Flowerbed with Blooming Flowers
      const w = dec.width || 120;
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-w / 2, -12, w, 12);

      // Lush Green Leaves
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-w / 2 + 2, -16, w - 4, 6);

      // Flowers (Red, Yellow, Purple)
      const colors = ['#e74c3c', '#f1c40f', '#9b59b6'];
      for (let fx = -w / 2 + 10; fx < w / 2 - 5; fx += 15) {
        ctx.fillStyle = colors[Math.abs(Math.floor(fx)) % 3];
        ctx.beginPath();
        ctx.arc(fx, -20, 4, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (dec.type === 'bench') {
      // Park Bench
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(-22, -16, 44, 4);
      ctx.fillRect(-20, -12, 4, 12);
      ctx.fillRect(16, -12, 4, 12);
    }

    ctx.restore();
  }

  // 5. Street Lantern Posts with Warm Light Bloom
  drawStreetLantern(ctx, light) {
    ctx.save();
    ctx.translate(light.x, light.y);

    // Iron Lamp Post
    ctx.fillStyle = '#263238';
    ctx.fillRect(-3, -65, 6, 65);
    ctx.fillRect(-8, -68, 16, 4);

    // Lamp Glass Top
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(-6, -82, 12, 14);

    // Soft Warm Light Bloom (Glow Effect)
    const glowGrad = ctx.createRadialGradient(0, -75, 2, 0, -75, 45);
    glowGrad.addColorStop(0, 'rgba(255, 209, 102, 0.6)');
    glowGrad.addColorStop(0.5, 'rgba(255, 183, 3, 0.25)');
    glowGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, -75, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ----------------------------------------------------
  // 🏰 HIGH/DARK FANTASY STRUCTURE & PROP RENDERERS
  // ----------------------------------------------------

  // 1. Ancient Mossy Rune Pillar
  drawAncientPillar(ctx, pillar) {
    ctx.save();
    ctx.translate(pillar.x, pillar.y);
    const h = pillar.height || 180;
    const w = pillar.width || 44;

    // Base Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2 + 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pillar Base Pedestal
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-w / 2 - 8, -20, w + 16, 20);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(-w / 2 - 4, -20, w + 8, 4);

    // Pillar Shaft (Granite Column)
    const pillarGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    pillarGrad.addColorStop(0, '#1c2833');
    pillarGrad.addColorStop(0.3, '#34495e');
    pillarGrad.addColorStop(0.7, '#5d6d7e');
    pillarGrad.addColorStop(1, '#1c2833');
    ctx.fillStyle = pillarGrad;
    ctx.fillRect(-w / 2, -h + 20, w, h - 40);

    // Glowing Magical Runes Engraved on Column
    const runeGlow = Math.sin(this.animTime * 3 + pillar.x) * 0.35 + 0.65;
    const runeColor = pillar.runeColor || '#00d2d3';
    ctx.fillStyle = runeColor;
    ctx.globalAlpha = runeGlow;
    for (let y = -h + 40; y < -30; y += 30) {
      ctx.fillRect(-6, y, 12, 3);
      ctx.fillRect(-2, y - 8, 4, 16);
      ctx.fillRect(-8, y + 4, 4, 4);
    }
    ctx.globalAlpha = 1.0;

    // Overgrown Moss & Ivy Vines
    ctx.fillStyle = '#27ae60';
    for (let vy = -h + 30; vy < -10; vy += 25) {
      ctx.fillRect(-w / 2 - 2, vy, 6, 12);
      ctx.fillRect(w / 2 - 4, vy + 10, 6, 10);
    }

    // Capital (Top Pillar Cap)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-w / 2 - 10, -h, w + 20, 20);
    ctx.fillStyle = '#5d6d7e';
    ctx.fillRect(-w / 2 - 6, -h + 16, w + 12, 4);

    ctx.restore();
  }

  // 2. Flickering Torch & Magic Brazier with Flame Particles & Light Source
  drawTorch(ctx, torch) {
    ctx.save();
    ctx.translate(torch.x, torch.y);
    const theme = torch.theme || 'fire';

    // Iron Sconce Holder
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(-4, -40, 8, 40);
    ctx.fillRect(-10, -45, 20, 8);

    // Brazier Bowl
    ctx.beginPath();
    ctx.moveTo(-14, -45);
    ctx.lineTo(-18, -60);
    ctx.lineTo(18, -60);
    ctx.lineTo(14, -45);
    ctx.closePath();
    ctx.fillStyle = '#2c3e50';
    ctx.fill();

    // Fire Flame Core
    const fireTime = this.animTime * 10 + torch.x;
    const flameH = 24 + Math.sin(fireTime * 1.5) * 6;
    const flameW = 16 + Math.cos(fireTime * 2) * 4;

    const fireGrad = ctx.createRadialGradient(0, -60 - flameH / 2, 2, 0, -60 - flameH / 2, flameH);
    if (theme === 'blue_magic') {
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.4, '#00d2d3');
      fireGrad.addColorStop(1, 'rgba(9, 132, 227, 0)');
    } else {
      fireGrad.addColorStop(0, '#fff200');
      fireGrad.addColorStop(0.4, '#ff7675');
      fireGrad.addColorStop(1, 'rgba(214, 48, 49, 0)');
    }

    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.ellipse(0, -60 - flameH / 2, flameW, flameH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rising Flame Ember Particles
    for (let i = 0; i < 4; i++) {
      const px = (Math.sin(fireTime + i * 2) * 8);
      const py = -65 - ((fireTime * 8 + i * 15) % 25);
      ctx.fillStyle = theme === 'blue_magic' ? '#74b9ff' : '#fffa65';
      ctx.fillRect(px, py, 2.5, 2.5);
    }

    // Radial Light Source Glow (Ambient Light Map registration info)
    const glowRadius = torch.radius || 130;
    const glowGrad = ctx.createRadialGradient(0, -60, 5, 0, -60, glowRadius);
    if (theme === 'blue_magic') {
      glowGrad.addColorStop(0, 'rgba(0, 210, 211, 0.45)');
      glowGrad.addColorStop(0.5, 'rgba(9, 132, 227, 0.18)');
      glowGrad.addColorStop(1, 'rgba(9, 132, 227, 0)');
    } else {
      glowGrad.addColorStop(0, 'rgba(255, 170, 0, 0.5)');
      glowGrad.addColorStop(0.5, 'rgba(235, 94, 40, 0.2)');
      glowGrad.addColorStop(1, 'rgba(235, 94, 40, 0)');
    }

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, -60, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Carved Granite Gargoyle Statue
  drawGargoyleStatue(ctx, statue) {
    ctx.save();
    ctx.translate(statue.x, statue.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pedestal
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-22, -35, 44, 35);
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(-26, -35, 52, 6);

    // Gargoyle Silhouette
    ctx.fillStyle = '#7f8c8d';
    // Wings
    ctx.beginPath();
    ctx.moveTo(-10, -55);
    ctx.lineTo(-38, -85);
    ctx.lineTo(-20, -75);
    ctx.lineTo(-30, -60);
    ctx.lineTo(-10, -55);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -55);
    ctx.lineTo(38, -85);
    ctx.lineTo(20, -75);
    ctx.lineTo(30, -60);
    ctx.lineTo(10, -55);
    ctx.fill();

    // Body & Horned Head
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.arc(0, -65, 14, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(-6, -75);
    ctx.lineTo(-12, -90);
    ctx.lineTo(-2, -77);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -75);
    ctx.lineTo(12, -90);
    ctx.lineTo(2, -77);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-5, -67, 3, 3);
    ctx.fillRect(2, -67, 3, 3);

    ctx.restore();
  }

  // 4. Background Animated Lava Waterfall
  drawLavaWaterfall(ctx, fall) {
    ctx.save();
    ctx.translate(fall.x, fall.y);
    const h = fall.height || 350;
    const w = fall.width || 60;
    const anim = (this.animTime * 60 + fall.x) % 40;

    // Lava Stream Back Body
    const lavaGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    lavaGrad.addColorStop(0, '#c0392b');
    lavaGrad.addColorStop(0.3, '#e74c3c');
    lavaGrad.addColorStop(0.7, '#f39c12');
    lavaGrad.addColorStop(1, '#c0392b');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(-w / 2, 0, w, h);

    // Cascading Bright Yellow Magma Ribbons
    ctx.fillStyle = '#fffa65';
    for (let y = anim - 40; y < h; y += 40) {
      ctx.fillRect(-w / 2 + 10, y, w - 20, 8);
      ctx.fillRect(-w / 2 + 5, y + 20, w / 2, 6);
    }

    // Bottom Magma Pool Splash Particles
    ctx.fillStyle = '#ff7675';
    for (let i = 0; i < 8; i++) {
      const sx = -w / 2 + ((i * 17 + anim * 2) % w);
      const sy = h - 5 - (i * 3 + Math.sin(this.animTime * 5 + i) * 10);
      ctx.fillRect(sx, sy, 4, 4);
    }

    ctx.restore();
  }

  // 5. Glowing Magical Crystal Cluster
  drawCrystalCluster(ctx, crystal) {
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    const color = crystal.color || '#00d2d3';
    const pulse = Math.sin(this.animTime * 4 + crystal.x) * 0.15 + 0.85;

    // Crystal Shards
    const shards = [
      { x: 0, h: 42, w: 12, rot: 0 },
      { x: -10, h: 32, w: 9, rot: -0.25 },
      { x: 10, h: 35, w: 10, rot: 0.2 },
      { x: -18, h: 22, w: 7, rot: -0.45 },
      { x: 18, h: 24, w: 8, rot: 0.4 }
    ];

    shards.forEach(s => {
      ctx.save();
      ctx.translate(s.x, 0);
      ctx.rotate(s.rot);

      ctx.fillStyle = color;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.moveTo(0, -s.h);
      ctx.lineTo(-s.w / 2, -10);
      ctx.lineTo(0, 0);
      ctx.lineTo(s.w / 2, -10);
      ctx.closePath();
      ctx.fill();

      // Highlight Edge
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = pulse * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -s.h);
      ctx.lineTo(-s.w / 2, -10);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Ambient Glow
    const glowGrad = ctx.createRadialGradient(0, -20, 2, 0, -20, 60);
    glowGrad.addColorStop(0, color);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.globalAlpha = pulse * 0.4;
    ctx.beginPath();
    ctx.arc(0, -20, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 6. Ancient Gothic Ruin Archway
  drawGothicArch(ctx, arch) {
    ctx.save();
    ctx.translate(arch.x, arch.y);
    const w = arch.width || 220;
    const h = arch.height || 260;

    // Two Columns
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-w / 2, -h, 36, h);
    ctx.fillRect(w / 2 - 36, -h, 36, h);

    // Gothic Pointed Arch Apex
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 10, -h);
    ctx.quadraticCurveTo(-w / 4, -h - 70, 0, -h - 95);
    ctx.quadraticCurveTo(w / 4, -h - 70, w / 2 + 10, -h);
    ctx.lineTo(w / 2 - 36, -h);
    ctx.quadraticCurveTo(w / 4, -h - 35, 0, -h - 55);
    ctx.quadraticCurveTo(-w / 4, -h - 35, -w / 2 + 36, -h);
    ctx.closePath();
    ctx.fillStyle = '#34495e';
    ctx.fill();

    // Keystone Jewel in Arch Center
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-8, -h - 90, 16, 18);

    ctx.restore();
  }
}


