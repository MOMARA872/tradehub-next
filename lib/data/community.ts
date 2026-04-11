export interface CommunityComment {
  userId: string;
  body: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  category: 'announcement' | 'discussion' | 'tip' | 'question';
  title: string;
  body: string;
  likes: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  comments: CommunityComment[];
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post001', userId: 'user007', category: 'announcement', title: 'Spring Cleanup Day — Volunteers Needed!',
    body: "We're organizing a community spring cleanup at Watson Lake Park this Saturday from 9am-1pm. Bring gloves, trash bags provided. Pizza lunch after! All ages welcome.",
    likes: 24, commentCount: 8, isPinned: true, createdAt: '2024-03-20T09:00:00Z',
    comments: [
      { userId: 'user001', body: "Count me in! I'll bring extra gloves.", createdAt: '2024-03-20T10:30:00Z' },
      { userId: 'user004', body: 'Great initiative Patricia! My family will be there.', createdAt: '2024-03-20T11:00:00Z' },
      { userId: 'user008', body: 'I can bring a truck if we need to haul anything.', createdAt: '2024-03-20T12:15:00Z' },
    ],
  },
  {
    id: 'post002', userId: 'user001', category: 'discussion', title: 'Best local spots for craft supplies?',
    body: "I'm looking for good places to buy art supplies and craft materials in the Prescott area. Any recommendations beyond the big box stores?",
    likes: 15, commentCount: 6, isPinned: false, createdAt: '2024-03-21T14:00:00Z',
    comments: [
      { userId: 'user005', body: 'The Art Store on Cortez St has amazing paint selections!', createdAt: '2024-03-21T14:45:00Z' },
      { userId: 'user007', body: 'Habitat for Humanity ReStore has great reclaimed materials for mixed-media projects.', createdAt: '2024-03-21T15:20:00Z' },
    ],
  },
  {
    id: 'post003', userId: 'user002', category: 'tip', title: 'Pro Tip: Take clear photos to sell faster',
    body: "After 50+ trades on TradeHub, here's my advice: natural lighting, clean background, multiple angles, and always include a size reference. My listings with 3+ good photos sell 4x faster.",
    likes: 42, commentCount: 12, isPinned: false, createdAt: '2024-03-19T08:00:00Z',
    comments: [
      { userId: 'user003', body: 'This is so true! I started doing this and my items move much faster.', createdAt: '2024-03-19T09:30:00Z' },
      { userId: 'user006', body: 'Would add: clean your item before photographing. Makes a huge difference.', createdAt: '2024-03-19T10:00:00Z' },
    ],
  },
  {
    id: 'post004', userId: 'user004', category: 'question', title: 'Anyone know a good local mechanic who does trade/barter?',
    body: "My truck needs brake work and I'd rather trade carpentry services than pay cash right now. Anyone know a mechanic in Prescott who's open to bartering?",
    likes: 9, commentCount: 4, isPinned: false, createdAt: '2024-03-22T16:00:00Z',
    comments: [
      { userId: 'user008', body: "Try posting in the Services category — I've seen mechanics there before.", createdAt: '2024-03-22T17:00:00Z' },
      { userId: 'user001', body: "I know someone! I'll DM you their info.", createdAt: '2024-03-22T17:30:00Z' },
    ],
  },
  {
    id: 'post005', userId: 'user006', category: 'announcement', title: 'Free outdoor concert series starts next month',
    body: 'The Prescott Summer Concert Series kicks off April 5th at the Courthouse Plaza! Every Friday evening through September. Local bands, food vendors, and family-friendly vibes.',
    likes: 31, commentCount: 5, isPinned: false, createdAt: '2024-03-23T11:00:00Z',
    comments: [
      { userId: 'user007', body: 'Love this series! Best part of summer in Prescott.', createdAt: '2024-03-23T12:00:00Z' },
    ],
  },
];
