export interface IPlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
  inventory: any;
  sp: number;
  str: number;
  agi: number;
  vit: number;
  hasBelt: boolean;
  questStatus: number;
  questProgress: number;
  jobClass: string;
  guildName: string;
  invincibleUntil: number;
  isMounted: boolean;
  hasWeapon: boolean;
  rebirthCount: number;
  hasPet: boolean;
  isAFK: boolean;
  combo: number;
  vy: number;
  isGrounded: boolean;
  isClimbing: boolean;
  partyId: string;
  weaponLevel: number;
  beltLevel: number;
  isAutoHunting: boolean;
  isChampion: boolean;
  skp: number;
  skillLevel1: number;
  skillLevel2: number;
  skillLevel3: number;
  codexCount: number;
}

export interface IMonsterState {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  isWorldBoss: boolean;
}

export interface IGameState {
  players: Map<string, IPlayerState>;
  monsters: Map<string, IMonsterState>;
  items: Map<string, IItemState>;
  npcs: Map<string, INpcState>;
  isNight: boolean;
  isHotTime: boolean;
  weather: string;
}

export interface IItemState {
  id: string;
  type: string;
  amount: number;
  x: number;
  y: number;
}

export interface INpcState {
  id: string;
  name: string;
  x: number;
  y: number;
}
