import { TOWN_NPCS } from './coral_island.js';
import { FOREST_NPCS } from './forest.js';
import { HIGHLAND_NPCS } from './highland.js';
import { CAVE_NPCS } from './cave.js';

/**
 * 🎨 Master NPC Registry for Designers
 */
export const NPC_REGISTRY = {
  map1: FOREST_NPCS,
  map2: HIGHLAND_NPCS,
  map3: CAVE_NPCS,
  map4: TOWN_NPCS
};

export function getNPCsForMap(mapId = 'map4') {
  return NPC_REGISTRY[mapId] || [];
}

export function getNPCById(npcId) {
  for (const mapId in NPC_REGISTRY) {
    const found = NPC_REGISTRY[mapId].find(npc => npc.id === npcId);
    if (found) return found;
  }
  return null;
}
