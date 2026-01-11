export interface Spell {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'buff';
  cooldown: number; 
}

export const SPELLS: Spell[] = [
  // ATTACKS
  {
    id: 'symbol_storm',
    name: 'Symbol Storm',
    description: 'Injects 4 special characters (e.g. ";{{/") into the opponent\'s text.',
    type: 'attack',
    cooldown: 0 
  },
  {
    id: 'gibberish',
    name: 'Void Babble',
    description: 'Inserts a random 6-letter gibberish word into the text.',
    type: 'attack',
    cooldown: 0
  },
  {
    id: 'heavy_freeze',
    name: 'Brain Freeze',
    description: 'Increases the opponent\'s freeze penalty to 1.5 seconds for the round.',
    type: 'attack',
    cooldown: 0
  },
  // BUFFS
  {
    id: 'shield',
    name: 'Typo Shield',
    description: 'Prevents freezing for your first 5 typos.',
    type: 'buff',
    cooldown: 0
  },
  {
    id: 'time_warp',
    name: 'Time Warp',
    description: 'Deducts 3 seconds from your race duration.',
    type: 'buff',
    cooldown: 0
  }
];
