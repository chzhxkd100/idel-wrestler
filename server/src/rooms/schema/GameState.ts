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
  @type("number") sp: number;
  @type("number") str: number;
  @type("number") agi: number;
  @type("number") vit: number;
  @type("boolean") hasBelt: boolean;
  @type("number") questStatus: number;
  @type("number") questProgress: number;
  @type("string") jobClass: string;
  @type("string") guildName: string;
  @type("number") invincibleUntil: number;
  @type("boolean") isMounted: boolean;
  @type("boolean") hasWeapon: boolean;
  @type("number") rebirthCount: number;
  @type("boolean") hasPet: boolean;
  @type("boolean") isAFK: boolean;
  @type("number") combo: number;
  lastMoveTime: number = Date.now();
  lastAttackTime: number = 0;

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
    this.sp = 0;
    this.str = 10;
    this.agi = 10;
    this.vit = 10;
    this.hasBelt = false;
    this.questStatus = 0;
    this.questProgress = 0;
    this.jobClass = "Novice";
    this.guildName = "None";
    this.invincibleUntil = 0;
    this.isMounted = false;
    this.hasWeapon = false;
    this.rebirthCount = 0;
    this.hasPet = false;
    this.isAFK = false;
    this.combo = 0;
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
  @type("boolean") isWorldBoss: boolean;
  
  damage: number = 10;
  speed: number = 2;
  expReward: number = 10;

  constructor(id: string, isBoss: boolean = false, isWorldBoss: boolean = false) {
    super();
    this.id = id;
    this.type = isWorldBoss ? "world_boss" : (isBoss ? "boss" : "normal");
    this.isBoss = isBoss;
    this.isWorldBoss = isWorldBoss;
    this.x = Math.random() * 600 + 100;
    this.y = Math.random() * 400 + 100;
    
    if (isWorldBoss) {
        this.maxHp = 10000;
        this.hp = this.maxHp;
        this.damage = 100;
        this.speed = 4;
        this.expReward = 5000;
    } else if (isBoss) {
        this.maxHp = 500;
        this.hp = this.maxHp;
        this.damage = 30;
        this.speed = 3;
        this.expReward = 100;
    } else {
        this.maxHp = 50;
        this.hp = this.maxHp;
        this.damage = 10;
        this.speed = 1.5;
        this.expReward = 10;
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
  @type("boolean") isNight: boolean = false;
  @type("boolean") isHotTime: boolean = false;
  @type("string") weather: string = "clear";
}
