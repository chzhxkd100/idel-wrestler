import { Schema, type, MapSchema } from "@colyseus/schema";
import { IPlayerState } from "shared";

export class Player extends Schema implements IPlayerState {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") level: number;
  @type("number") hp: number;
  @type("number") maxHp: number;

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
    this.x = 0;
    this.y = 0;
    this.level = 1;
    this.maxHp = 100;
    this.hp = 100;
  }
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
