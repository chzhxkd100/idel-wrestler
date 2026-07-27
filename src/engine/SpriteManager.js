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

  // Draw NPC Character & Name / Prompt Tag
  drawNPC(ctx, npc, isNearby) {
    ctx.save();
    ctx.translate(npc.x, npc.y);

    const idleBob = Math.sin(this.animTime * 3) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // NPC Sprite Image
    if (!this.npcGirlImg) {
      this.npcGirlImg = new Image();
      this.npcGirlImg.src = '/assets/npc_girl.png';
    }

    if (this.npcGirlImg.complete && this.npcGirlImg.naturalWidth !== 0) {
      ctx.drawImage(this.npcGirlImg, -45, -112 + idleBob, 90, 115);
    } else {
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(0, -45 + idleBob, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name Tag Box
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    
    const tagW = 135;
    const tagH = 20;
    const tagY = -124 + idleBob;

    ctx.fillStyle = 'rgba(12, 18, 30, 0.88)';
    ctx.fillRect(-tagW / 2, tagY, tagW, tagH);
    ctx.strokeStyle = isNearby ? '#00d2d3' : 'rgba(0, 210, 211, 0.4)';
    ctx.lineWidth = isNearby ? 2 : 1;
    ctx.strokeRect(-tagW / 2, tagY, tagW, tagH);

    ctx.fillStyle = '#00d2d3';
    ctx.fillText(npc.name || 'NPC', 0, tagY + 13);

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
}
