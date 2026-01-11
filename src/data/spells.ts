export interface Spell {
  id: string;
  name: string;
  description: string;
  cooldown: number; 
}

export const SPELLS: Spell[] = [
  {
    id: 'symbol_storm',
    name: 'Symbol Storm',
    description: 'Injects 4 special characters (e.g. ";{{/") into the opponent\'s text.',
    cooldown: 0 
  },
  {
    id: 'gibberish',
    name: 'Void Babble',
    description: 'Inserts a random 6-letter gibberish word into the text.',
    cooldown: 0
  },
  {
    id: 'heavy_freeze',
    name: 'Brain Freeze',
    description: 'Increases the opponent\'s freeze penalty to 1.5 seconds for the round.',
    cooldown: 0
  }
];
