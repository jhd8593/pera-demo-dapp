export interface Attack {
  name: string;
  damage: number;
  description: string;
  cooldown: number; // in turns
}

export interface Slug {
  id: number;
  name: string;
  image: string;
  health: number;
  maxHealth: number;
  attacks: Attack[];
}

export const SLUGS: Slug[] = [
  {
    id: 1,
    name: "Slugger",
    image: "Slugger.png",
    health: 150,
    maxHealth: 150,
    attacks: [
      {
        name: "Power Punch",
        damage: 40,
        description: "A devastating close-range attack",
        cooldown: 1
      },
      {
        name: "Ground Slam",
        damage: 60,
        description: "Slams the ground causing area damage",
        cooldown: 3
      },
      {
        name: "Quick Jab",
        damage: 20,
        description: "A fast attack that can be used frequently",
        cooldown: 0
      }
    ]
  },
  {
    id: 2,
    name: "Daggerpult",
    image: "Daggerpult.png",
    health: 120,
    maxHealth: 120,
    attacks: [
      {
        name: "Blade Storm",
        damage: 45,
        description: "Launches multiple sharp projectiles",
        cooldown: 2
      },
      {
        name: "Precision Strike",
        damage: 70,
        description: "A highly accurate single target attack",
        cooldown: 3
      },
      {
        name: "Throwing Knives",
        damage: 25,
        description: "Quick ranged attack",
        cooldown: 1
      }
    ]
  },
  {
    id: 3,
    name: "Zipacute",
    image: "Zipacute.png",
    health: 100,
    maxHealth: 100,
    attacks: [
      {
        name: "Lightning Strike",
        damage: 80,
        description: "Powerful electric attack",
        cooldown: 4
      },
      {
        name: "Static Shock",
        damage: 30,
        description: "Quick electric jolt",
        cooldown: 1
      },
      {
        name: "Thunder Wave",
        damage: 50,
        description: "Area of effect electric damage",
        cooldown: 2
      }
    ]
  },
  {
    id: 4,
    name: "Hailstorm",
    image: "Hailstorm.png",
    health: 130,
    maxHealth: 130,
    attacks: [
      {
        name: "Ice Blast",
        damage: 55,
        description: "Freezing projectile attack",
        cooldown: 2
      },
      {
        name: "Blizzard",
        damage: 75,
        description: "Massive area frost damage",
        cooldown: 4
      },
      {
        name: "Frost Bite",
        damage: 35,
        description: "Quick frost attack",
        cooldown: 1
      }
    ]
  }
];
