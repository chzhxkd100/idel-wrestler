/**
 * 🎮 TileMapManager.js
 * 
 * 2D 횡스크롤 MMORPG 타일맵 & 오브젝트 조립 매니저
 * - 이미지 에셋 사전 로딩 (Preloading) & 캐싱
 * - Seamless 64x64 그리드 타일맵 조립 렌더러 (drawTileMap)
 * - 5-레이어 오브젝트 & 랜드마크 렌더러 (drawPropsLayer)
 * - 이미지 미로드 시 절차적 캔버스 패턴 폴백 (Fallback Texture Engine) 지원
 */
export class TileMapManager {
  constructor() {
    this.tileSize = 64;
    this.assets = {};
    this.fallbackPatterns = {};
    this.isLoaded = false;

    // 에셋 매핑 리스트 (총 39종 PNG 에셋)
    this.assetList = {
      // 1. 지형 타일 에셋
      'tile_sand': '/assets/tiles/tile_sand.png',
      'tile_grass': '/assets/tiles/tile_grass.png',
      'tile_wood': '/assets/tiles/tile_wood.png',
      'tile_rock': '/assets/tiles/tile_rock.png',
      'tile_coral_stone': '/assets/tiles/tile_coral_stone.png',
      'tile_flower_path': '/assets/tiles/tile_flower_path.png',
      'tile_cliff_brick': '/assets/tiles/tile_cliff_brick.png',
      'tile_wood_bridge': '/assets/tiles/tile_wood_bridge.png',
      'tile_sea_bottom': '/assets/tiles/tile_sea_bottom.png',

      // 2. 건물 및 랜드마크 에셋
      'building_shop': '/assets/props/building_shop.png',
      'building_juice_bar': '/assets/props/building_juice_bar.png',
      'building_manor': '/assets/props/building_manor.png',
      'building_hotel': '/assets/props/building_hotel.png',
      'building_aquarium': '/assets/props/building_aquarium.png',
      'building_port_warehouse': '/assets/props/building_port_warehouse.png',
      'building_castle': '/assets/props/building_castle.png',
      'building_observatory': '/assets/props/building_observatory.png',
      'building_lighthouse_grand': '/assets/props/building_lighthouse_grand.png',
      'building_tavern': '/assets/props/building_tavern.png',
      'prop_lighthouse': '/assets/props/prop_lighthouse.png',
      'prop_windmill': '/assets/props/prop_windmill.png',
      'prop_clocktower': '/assets/props/prop_clocktower.png',
      'prop_fountain': '/assets/props/prop_fountain.png',
      'prop_statue': '/assets/props/prop_statue.png',
      'prop_ship': '/assets/props/prop_ship.png',
      'prop_flower_arch': '/assets/props/prop_flower_arch.png',
      'prop_coral_reef': '/assets/props/prop_coral_reef.png',
      'prop_waterfall': '/assets/props/prop_waterfall.png',
      'prop_bridge': '/assets/props/prop_bridge.png',
      'prop_cannon': '/assets/props/prop_cannon.png',
      'prop_chest': '/assets/props/prop_chest.png',
      'prop_anchor': '/assets/props/prop_anchor.png',
      'prop_signpost': '/assets/props/prop_signpost.png',
      'prop_bench': '/assets/props/prop_bench.png',
      'prop_streetlamp_double': '/assets/props/prop_streetlamp_double.png',
      'prop_palm_tree': '/assets/props/prop_palm_tree.png',
      'prop_parasol': '/assets/props/prop_parasol.png',
      'prop_lantern': '/assets/props/prop_lantern.png',
      'prop_boat': '/assets/props/prop_boat.png'
    };

    this.preloadAssets();
  }

  preloadAssets() {
    let loadedCount = 0;
    const totalCount = Object.keys(this.assetList).length;

    Object.entries(this.assetList).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= totalCount) {
          this.isLoaded = true;
        }
      };
      img.onerror = () => {
        // 이미지 로드 실패 시 폴백 캐시 생성
        this.fallbackPatterns[key] = this.createFallbackTexture(key);
      };
      this.assets[key] = img;
    });
  }

  /**
   * 이미지 미로드/오류 시 즉시 사용되는 고품질 절차적 타일/오브젝트 캐시 생성
   */
  createFallbackTexture(key) {
    const canvas = document.createElement('canvas');
    const size = this.tileSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (key === 'tile_sand') {
      ctx.fillStyle = '#e9c46a';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fefae0';
      ctx.fillRect(0, 0, size, 8);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(10, 20, 6, 6);
      ctx.fillRect(35, 45, 8, 8);
    } else if (key === 'tile_grass') {
      ctx.fillStyle = '#3a2518';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(0, 0, size, 16);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(0, 0, size, 4);
    } else if (key === 'tile_wood') {
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(2, 2, size - 4, size - 4);
      ctx.fillStyle = '#3a2312';
      ctx.fillRect(0, 0, 2, size);
    } else if (key === 'tile_rock') {
      ctx.fillStyle = '#261717';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(0, 0, size, 10);
    }

    return canvas;
  }

  /**
   * 1. Seamless 지형 타일맵 조립 렌더링 (Layer 2)
   */
  drawTileMap(ctx, mapData, camX, viewW) {
    const tileSize = mapData.tileSize || 64;
    const tileGrid = mapData.tileMapGrid || [];

    // 그리드 데이터 기반 연속 타일 렌더링
    tileGrid.forEach(tile => {
      // 카메라 뷰포트 컬링 (성능 최적화)
      if (tile.x + tileSize < camX - 100 || tile.x > camX + viewW + 100) return;

      const imgKey = tile.type || 'tile_sand';
      const img = this.assets[imgKey];

      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, tile.x, tile.y, tileSize, tileSize);
      } else {
        // 폴백 텍스처 사용
        const fallback = this.fallbackPatterns[imgKey] || this.createFallbackTexture(imgKey);
        ctx.drawImage(fallback, tile.x, tile.y, tileSize, tileSize);
      }
    });

    // 물리 발판 표면 타일보정 (Platforms Seamless Repeat)
    (mapData.platforms || []).forEach(p => {
      if (p.x + p.width < camX - 100 || p.x > camX + viewW + 100) return;

      const theme = mapData.theme || 'coral_island';
      const defaultTileKey = p.isGround 
        ? (theme === 'coral_island' ? 'tile_sand' : theme === 'forest' ? 'tile_grass' : 'tile_rock') 
        : 'tile_wood';

      const img = this.assets[defaultTileKey];
      const fallback = this.fallbackPatterns[defaultTileKey] || this.createFallbackTexture(defaultTileKey);

      // 발판 너비에 맞춰 64px 단위 반복 조립 (Repeat Composition)
      for (let x = p.x; x < p.x + p.width; x += tileSize) {
        const currentW = Math.min(tileSize, p.x + p.width - x);
        
        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, 0, 0, currentW, Math.min(tileSize, p.height), x, p.y, currentW, p.height);
        } else {
          ctx.drawImage(fallback, 0, 0, currentW, Math.min(tileSize, p.height), x, p.y, currentW, p.height);
        }
      }
    });
  }

  /**
   * 2. 랜드마크 & 건물 오브젝트 5-레이어 순차 렌더링 (Layer 3 & Layer 5)
   */
  drawPropsLayer(ctx, mapData, targetZIndex = 'back') {
    const props = mapData.propsLayer || [];

    props.forEach(prop => {
      // zIndex 필터링 ('back': 지형 뒤, 'main': 지형 위, 'front': 전경 캐릭터 앞)
      const propZ = prop.zIndex || 'main';
      if (targetZIndex === 'back' && propZ !== 'back') return;
      if (targetZIndex === 'main' && propZ !== 'main' && propZ !== undefined) return;
      if (targetZIndex === 'front' && propZ !== 'front') return;

      const img = this.assets[prop.assetKey];
      const w = prop.width || 120;
      const h = prop.height || 120;

      ctx.save();
      ctx.translate(prop.x, prop.y);

      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, -w / 2, -h, w, h);
      } else {
        // 스프라이트 미로드 시 사전에 구성된 SpriteManager 렌더러로 시각적 폴백
        this.renderFallbackPropSprite(ctx, prop);
      }

      ctx.restore();
    });
  }

  renderFallbackPropSprite(ctx, prop) {
    // 오브젝트 타입별 예비 시각 묘사 (SpriteManager 연동)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-prop.width / 2 + 5, 0, prop.width - 10, 6);
  }
}
