import { Schema, type, MapSchema } from "@colyseus/schema";
import { IPlayerState, IMonsterState } from "shared";

export class Player extends Schema implements IPlayerState {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") level: number;
  @type("number") hp: number;
  @type("number") maxHp: number;
  @type("number") exp: number;
  @type("number") maxExp: number;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
    this.x = Math.random() * 800;
    this.y = Math.random() * 600;
    this.level = 1;
    this.maxHp = 100;
    this.hp = 100;
    this.exp = 0;
    this.maxExp = 100;
  }
}

export class Monster extends Schema implements IMonsterState {
  @type("string") id: string;
  @type("string") type: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") hp: number;
  @type("number") maxHp: number;

  targetId: string | null = null;
  speed: number = 2;
  damage: number = 5;
  expReward: number = 20;

  constructor(id: string) {
    super();
    this.id = id;
    this.type = "goblin";
    this.x = Math.random() * 800;
    this.y = Math.random() * 600;
    this.maxHp = 50;
    this.hp = 50;
  }
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
}
