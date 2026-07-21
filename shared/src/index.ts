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
}

export interface IMonsterState {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isBoss: boolean;
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
