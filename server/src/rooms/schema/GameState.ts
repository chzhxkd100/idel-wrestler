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
    this.x = 400 + Math.floor(Math.random() * 100 - 50);
    this.y = 500;
    this.level = 1;
    this.hp = 100;
    this.maxHp = 100;
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

  constructor(id: string, type: string = "Slime", x: number = 600, y: number = 500) {
    super();
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = 50;
    this.maxHp = 50;
  }
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
}
