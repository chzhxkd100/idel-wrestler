import { Schema, type, MapSchema } from "@colyseus/schema";
import { IPlayerState, IMonsterState, IItemState, INpcState } from "shared";

export class Player extends Schema implements IPlayerState {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") level: number;
  @type("number") hp: number;
  @type("number") maxHp: number;
  @type("number") mp: number;
  @type("number") maxMp: number;
  @type("number") exp: number;
  @type("number") maxExp: number;
  @type({ map: "number" }) inventory = new MapSchema<number>();

  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
    this.x = Math.random() * 800;
    this.y = Math.random() * 600;
    this.level = 1;
    this.maxHp = 100;
    this.hp = 100;
    this.maxMp = 50;
    this.mp = 50;
    this.exp = 0;
    this.maxExp = 100;
    this.inventory.set("gold", 0);
  }
}

export class Monster extends Schema implements IMonsterState {
  @type("string") id: string;
  @type("string") type: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") hp: number;
  @type("number") maxHp: number;
  @type("boolean") isBoss: boolean;

  targetId: string | null = null;
  speed: number = 2;
  damage: number = 5;
  expReward: number = 20;

  constructor(id: string, isBoss: boolean = false) {
    super();
    this.id = id;
    this.type = isBoss ? "boss_ogre" : "goblin";
    this.x = Math.random() * 800;
    this.y = Math.random() * 600;
    this.isBoss = isBoss;

    if (isBoss) {
      this.maxHp = 500;
      this.hp = 500;
      this.damage = 15;
      this.speed = 1.5;
      this.expReward = 200;
    } else {
      this.maxHp = 50;
      this.hp = 50;
    }
  }
}

export class Item extends Schema implements IItemState {
  @type("string") id: string;
  @type("string") type: string;
  @type("number") amount: number;
  @type("number") x: number;
  @type("number") y: number;

  constructor(id: string, type: string, amount: number, x: number, y: number) {
    super();
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.x = x;
    this.y = y;
  }
}

export class Npc extends Schema implements INpcState {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;

  constructor(id: string, name: string, x: number, y: number) {
    super();
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
  }
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type({ map: Item }) items = new MapSchema<Item>();
  @type({ map: Npc }) npcs = new MapSchema<Npc>();
}
