export interface Spell {
  id: string;
  name: string;
  description: string;
  cooldown: number; // in seconds, or maybe just 'once per round'
}

export const SPELLS: Spell[] = [
  {
    id: 'symbol_storm',
    name: 'Symbol Storm',
    description: 'Inserts a chaos string (e.g. ";{{/.") into your opponent\'s text.',
    cooldown: 0 // Single use per round for now
  }
];
