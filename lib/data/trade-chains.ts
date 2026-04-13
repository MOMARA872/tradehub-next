export interface TradeChainStep {
  item: string;
  emoji: string;
  tradedWith: string;
  value: number;
  date: string;
  description: string;
}

export interface TradeChain {
  id: string;
  userId: string;
  name: string;
  startItem: string;
  startEmoji: string;
  goalItem: string;
  goalEmoji: string;
  isPublic: boolean;
  steps: TradeChainStep[];
}

export const TRADE_CHAINS: TradeChain[] = [
  {
    id: 'chain001', userId: 'user002', name: 'The 5-Step Hobby Quest',
    startItem: 'Canon Camera', startEmoji: 'Camera', goalItem: 'Kayak', goalEmoji: 'Sailboat', isPublic: true,
    steps: [
      { item: 'Canon Camera', emoji: 'Camera', tradedWith: 'Sarah (user001)', value: 400, date: '2024-01-15', description: 'Starting item from estate sale' },
      { item: 'Mountain Bike', emoji: 'Bike', tradedWith: 'Tomas (user008)', value: 350, date: '2024-02-01', description: 'Traded camera for vintage Trek bike' },
      { item: 'Guitar', emoji: 'Music', tradedWith: 'David (user006)', value: 300, date: '2024-02-20', description: 'Traded bike for beginner guitar' },
      { item: 'Camping Gear', emoji: 'Tent', tradedWith: 'Marcus (user004)', value: 280, date: '2024-03-10', description: 'Traded guitar for camping equipment' },
      { item: 'Kayak', emoji: 'Sailboat', tradedWith: 'Local Sports Co-op', value: 250, date: '2024-03-24', description: 'Traded camping gear for kayak - QUEST COMPLETE!' },
    ],
  },
  {
    id: 'chain002', userId: 'user005', name: 'Home Improvement Journey',
    startItem: 'Writing Services', startEmoji: 'PenLine', goalItem: 'Beautiful Garden', goalEmoji: 'Flower2', isPublic: false,
    steps: [
      { item: 'Writing Services', emoji: 'PenLine', tradedWith: 'Local Business', value: 200, date: '2024-01-10', description: 'Website content writing hours' },
      { item: 'Furniture', emoji: 'Armchair', tradedWith: 'Emma (user003)', value: 180, date: '2024-02-05', description: 'Traded writing for shelving units' },
      { item: 'Home Repairs', emoji: 'Hammer', tradedWith: 'Marcus (user004)', value: 160, date: '2024-02-25', description: 'Traded furniture rearrangement help for repairs' },
      { item: 'Garden Plants & Seeds', emoji: 'Flower2', tradedWith: 'Thomas (user008)', value: 100, date: '2024-03-22', description: 'Traded home advice for garden setup' },
    ],
  },
];
