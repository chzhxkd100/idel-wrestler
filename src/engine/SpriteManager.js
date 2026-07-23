export class SpriteManager {
  constructor() {
    this.animTime = 0;
  }

  update(dt) {
    this.animTime += dt;
  }

  // Draw Player Character
  drawPlayer(ctx, p, isLocal) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);

    const bob = Math.sin(this.animTime * 8) * (p.animState === 'walk' ? 4 : 2);

    // Player Shadow
    ctx.save();
    ctx.scale(p.facing, 1); // unflip shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isLocal) {
      // Local player arrow indicator
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(0, -65 + Math.sin(this.animTime * 10) * 3);
      ctx.lineTo(-6, -75 + Math.sin(this.animTime * 10) * 3);
      ctx.lineTo(6, -75 + Math.sin(this.animTime * 10) * 3);
      ctx.closePath();
      ctx.fill();
    }

    // Player Nickname Above Head (Dynamic Width)
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(p.nickname).width;
    const padding = 12;
    const boxWidth = textWidth + padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-boxWidth / 2, -60, boxWidth, 18);
    ctx.fillStyle = isLocal ? '#ffd166' : '#ffffff';
    ctx.fillText(p.nickname, 0, -46);
    ctx.restore();

    // Player Body
    this.drawCharacterBody(ctx, p, bob);

    ctx.restore();
  }

  drawCharacterBody(ctx, p, bob) {
    // Body Armor
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-12, -36 + bob, 24, 26);

    // Chestplate Detail
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-8, -32 + bob, 16, 14);

    // Legs & Animation
    const legOffset = p.animState === 'walk' ? Math.sin(this.animTime * 12) * 8 : 0;
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(-10 + legOffset, -10 + bob, 8, 10);
    ctx.fillRect(2 - legOffset, -10 + bob, 8, 10);

    // Boots
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(-12 + legOffset, -2 + bob, 10, 4);
    ctx.fillRect(0 - legOffset, -2 + bob, 10, 4);

    // Head / Helmet
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(0, -42 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Visor Glow
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(2, -44 + bob, 8, 4);
  }

  // Draw Animated Portal
  drawPortal(ctx, portal) {
    ctx.save();
    ctx.translate(portal.x, portal.y - 45);

    const rotation = this.animTime * 2;
    const scalePulse = 1 + Math.sin(this.animTime * 4) * 0.08;

    ctx.scale(scalePulse, scalePulse);

    // Outer Glow Circle
    ctx.fillStyle = 'rgba(88, 101, 242, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Portal Ring
    ctx.save();
    ctx.rotate(rotation);
    ctx.strokeStyle = '#5865f2';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Core Orb
    const coreGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.5, '#74b9ff');
    coreGradient.addColorStop(1, '#0984e3');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Portal Destination Label Tag
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-50, -45, 100, 16);
    ctx.fillStyle = '#6c5ce7';
    ctx.fillText(portal.label || '포탈 [W]', 0, -33);

    ctx.restore();
  }
}
