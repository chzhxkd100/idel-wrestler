export interface IPlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  level: number;
  hp: number;
  maxHp: number;
  exp: number;
  maxExp: number;
}

export interface IMonsterState {
  id: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}
