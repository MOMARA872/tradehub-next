/**
 * Seed script to populate Supabase with mock data.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.\n' +
    'Run with: npx tsx --env-file=.env.local scripts/seed.ts'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────
// Mock data (inlined from lib/data/)
// ─────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'jobs',
    name: 'Jobs',
    slug: 'jobs',
    icon: '💼',
    description: 'Full-time, part-time, gigs, and seasonal work opportunities',
    isHot: true,
    subcategories: ['Full-time', 'Part-time', 'Gigs', 'Internships', 'Remote', 'Seasonal'],
  },
  {
    id: 'housing',
    name: 'Housing',
    slug: 'housing',
    icon: '🏠',
    description: 'Apartments, houses, roommates, and vacation rentals',
    isHot: true,
    subcategories: ['Rent', 'Sale', 'Roommate', 'Vacation Rental'],
  },
  {
    id: 'barter',
    name: 'Barter',
    slug: 'barter',
    icon: '🔄',
    description: 'Trade goods and services with community members',
    isHot: true,
    subcategories: ['Trade Goods', 'Skills Swap', 'Exchange'],
  },
  {
    id: 'trade',
    name: 'Trade',
    slug: 'trade',
    icon: '🤝',
    description: 'Buy, sell, negotiate, and make offers on items',
    isHot: true,
    subcategories: ['Buy/Sell', 'Negotiate', 'Make Offer'],
  },
  {
    id: 'services',
    name: 'Services',
    slug: 'services',
    icon: '🔧',
    description: 'Home, tech, health, and legal services',
    isHot: false,
    subcategories: ['Home Services', 'Tech Support', 'Health & Wellness', 'Legal'],
  },
  {
    id: 'resumes',
    name: 'Resumes',
    slug: 'resumes',
    icon: '📋',
    description: 'Post resumes, hire talent, and access CV bank',
    isHot: false,
    subcategories: ['Post Resume', 'Hire Talent', 'CV Bank'],
  },
  {
    id: 'shows',
    name: 'Shows & Events',
    slug: 'shows',
    icon: '🎭',
    description: 'Events, concerts, tickets, and classes',
    isHot: false,
    subcategories: ['Events', 'Concerts', 'Tickets', 'Classes'],
  },
  {
    id: 'community',
    name: 'Community',
    slug: 'community',
    icon: '👥',
    description: 'Connect with your neighbors and local groups',
    isHot: false,
    subcategories: ['Announcements', 'Groups', 'Discussions'],
  },
  {
    id: 'ads',
    name: 'Ads',
    slug: 'ads',
    icon: '📢',
    description: 'Sponsored and promotional business listings',
    isHot: false,
    subcategories: ['Sponsored', 'Promotional', 'Business'],
  },
  {
    id: 'freestuff',
    name: 'Free Stuff',
    slug: 'freestuff',
    icon: '🎁',
    description: 'Giveaways, donations, and lost & found items',
    isHot: true,
    subcategories: ['Giveaways', 'Donations', 'Lost & Found'],
  },
  {
    id: 'collections',
    name: 'Collections',
    slug: 'collections',
    icon: '🗂️',
    description: 'Curated bundles, themed lots, and collector items',
    isHot: true,
    subcategories: ['Vintage', 'Antiques', 'Vinyl & Records', 'Comics & Cards', 'Coins & Stamps', 'Art Prints'],
  },
];

const USERS = [
  {
    id: 'user001',
    displayName: 'Sarah Martinez',
    avatarInitials: 'SM',
    city: 'Prescott, AZ',
    bio: 'Local artist and craftsperson. Love trading handmade items!',
    isVerified: true,
    ratingAvg: 4.8,
    reviewCount: 24,
    trustScore: 92,
    joinedAt: '2023-06-15',
    responseRate: 98,
    listingCount: 12,
  },
  {
    id: 'user002',
    displayName: 'James Chen',
    avatarInitials: 'JC',
    city: 'Prescott, AZ',
    bio: 'Tech enthusiast. Always looking for interesting trades.',
    isVerified: true,
    ratingAvg: 4.9,
    reviewCount: 18,
    trustScore: 95,
    joinedAt: '2023-08-22',
    responseRate: 100,
    listingCount: 8,
  },
  {
    id: 'user003',
    displayName: 'Emma Wilson',
    avatarInitials: 'EW',
    city: 'Prescott, AZ',
    bio: 'Professional organizer. Selling off excess from recent downsizing.',
    isVerified: false,
    ratingAvg: 4.6,
    reviewCount: 12,
    trustScore: 85,
    joinedAt: '2024-01-10',
    responseRate: 92,
    listingCount: 6,
  },
  {
    id: 'user004',
    displayName: 'Marcus Johnson',
    avatarInitials: 'MJ',
    city: 'Prescott, AZ',
    bio: 'Handyman and builder. Available for trade work.',
    isVerified: true,
    ratingAvg: 4.7,
    reviewCount: 31,
    trustScore: 88,
    joinedAt: '2022-11-05',
    responseRate: 95,
    listingCount: 15,
  },
  {
    id: 'user005',
    displayName: 'Lisa Zhang',
    avatarInitials: 'LZ',
    city: 'Prescott, AZ',
    bio: 'Freelance writer and tutor. Happy to barter services!',
    isVerified: true,
    ratingAvg: 4.9,
    reviewCount: 22,
    trustScore: 94,
    joinedAt: '2023-05-18',
    responseRate: 98,
    listingCount: 9,
  },
  {
    id: 'user006',
    displayName: 'David Rodriguez',
    avatarInitials: 'DR',
    city: 'Prescott, AZ',
    bio: 'Local musician and music teacher.',
    isVerified: false,
    ratingAvg: 4.5,
    reviewCount: 8,
    trustScore: 78,
    joinedAt: '2024-02-01',
    responseRate: 88,
    listingCount: 4,
  },
  {
    id: 'user007',
    displayName: 'Patricia Brown',
    avatarInitials: 'PB',
    city: 'Prescott, AZ',
    bio: 'Retired educator. Community volunteer and book lover.',
    isVerified: true,
    ratingAvg: 4.8,
    reviewCount: 19,
    trustScore: 91,
    joinedAt: '2023-09-12',
    responseRate: 100,
    listingCount: 7,
  },
  {
    id: 'user008',
    displayName: 'Thomas Kelly',
    avatarInitials: 'TK',
    city: 'Prescott, AZ',
    bio: 'Gardener and plant enthusiast.',
    isVerified: false,
    ratingAvg: 4.4,
    reviewCount: 6,
    trustScore: 75,
    joinedAt: '2024-01-25',
    responseRate: 85,
    listingCount: 3,
  },
];

const LISTINGS = [
  {
    id: 'listing001',
    userId: 'user001',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Handmade Ceramic Vase - Blue Glaze',
    description: 'Beautiful handthrown ceramic vase with stunning blue glaze. Perfect condition, never used. Great for flowers or as decorative piece.',
    price: 45,
    priceType: 'fixed',
    condition: 'new',
    conditionNotes: 'Handcrafted, never displayed',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Ceramic+Vase'],
    status: 'active',
    createdAt: '2024-03-15',
    tags: ['ceramic', 'art', 'handmade', 'home-decor'],
  },
  {
    id: 'listing002',
    userId: 'user002',
    categoryId: 'barter',
    subcategory: 'Skills Swap',
    title: 'Web Design Skills - Trade for Guitar Lessons',
    description: 'Experienced web designer offering to create a professional website in exchange for guitar lessons (beginner level preferred). Can work within your budget/timeline.',
    price: 0,
    priceType: 'trade',
    condition: 'good',
    conditionNotes: 'Services offered - 10+ years experience',
    city: 'Phoenix, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Web+Design'],
    status: 'active',
    createdAt: '2024-03-18',
    tags: ['skills', 'web-design', 'trade', 'services'],
  },
  {
    id: 'listing003',
    userId: 'user003',
    categoryId: 'housing',
    subcategory: 'Roommate',
    title: 'Room for Rent - Downtown Prescott',
    description: 'Spacious furnished bedroom in charming 3BR house. Share kitchen and living areas with two other professionals. Quiet neighborhood, walking distance to downtown.',
    price: 650,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: 'Recently renovated, fully furnished',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Bedroom+Rental'],
    status: 'active',
    createdAt: '2024-03-10',
    tags: ['housing', 'rent', 'roommate', 'downtown'],
  },
  {
    id: 'listing004',
    userId: 'user004',
    categoryId: 'services',
    subcategory: 'Home Services',
    title: 'Carpentry & Deck Building - Reasonable Rates',
    description: 'Custom carpentry, deck building, fence repair, and general handyman work. Free estimates. 15+ years local experience. Licensed and insured.',
    price: 85,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Hourly or project-based rates',
    city: 'Tucson, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Carpentry+Services'],
    status: 'active',
    createdAt: '2024-03-12',
    tags: ['services', 'home-repair', 'carpentry', 'local'],
  },
  {
    id: 'listing005',
    userId: 'user005',
    categoryId: 'services',
    subcategory: 'Tech Support',
    title: 'Expert Tutoring - Writing, Grammar, ESL',
    description: 'Certified educator offering 1-on-1 tutoring in writing, grammar, and English as a Second Language. Flexible scheduling. All ages and levels welcome.',
    price: 40,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: '30-min sessions available',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Tutoring+Services'],
    status: 'active',
    createdAt: '2024-03-16',
    tags: ['tutoring', 'education', 'services', 'writing'],
  },
  {
    id: 'listing006',
    userId: 'user001',
    categoryId: 'freestuff',
    subcategory: 'Donations',
    title: 'Free - Bookcase & Books Collection',
    description: 'Solid wood bookcase (needs minor finishing) plus collection of 50+ books including fiction, history, and self-help. Must pick up by March 31st.',
    price: 0,
    priceType: 'free',
    condition: 'used',
    conditionNotes: 'Good condition, some books show age',
    city: 'Flagstaff, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Bookcase+Donation'],
    status: 'active',
    createdAt: '2024-03-20',
    tags: ['free', 'books', 'furniture', 'donation'],
  },
  {
    id: 'listing007',
    userId: 'user002',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Vintage Road Bike - 1985 Trek',
    description: 'Classic 1985 Trek road bike in excellent working condition. Recently tuned, new tires. Some cosmetic wear consistent with age.',
    price: 180,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Mechanically excellent, vintage appearance',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Vintage+Bike'],
    status: 'active',
    createdAt: '2024-03-14',
    tags: ['bike', 'vintage', 'sports', 'cycling'],
  },
  {
    id: 'listing008',
    userId: 'user006',
    categoryId: 'shows',
    subcategory: 'Classes',
    title: 'Guitar Lessons - All Levels Welcome',
    description: 'Professional musician offering guitar lessons for beginner through intermediate students. Private lessons in my studio or your home. First lesson free!',
    price: 35,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: '45-minute sessions',
    city: 'Sedona, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Guitar+Lessons'],
    status: 'active',
    createdAt: '2024-03-17',
    tags: ['lessons', 'music', 'guitar', 'education'],
  },
  {
    id: 'listing009',
    userId: 'user003',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Ikea KALLAX Shelving Units - Set of 2',
    description: 'Two white KALLAX shelving units from Ikea. Excellent condition, gently used. Perfect for organizing any room. Must take both.',
    price: 60,
    priceType: 'fixed',
    condition: 'likenew',
    conditionNotes: 'Very light use, like new condition',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Shelving+Units'],
    status: 'active',
    createdAt: '2024-03-19',
    tags: ['furniture', 'ikea', 'storage', 'home'],
  },
  {
    id: 'listing010',
    userId: 'user007',
    categoryId: 'community',
    subcategory: 'Announcements',
    title: 'Community Garden Plot Available - Share Harvest',
    description: 'Looking for someone to share community garden plot. Beautiful sunny location near courthouse. Established beds, water access included. Split harvest arrangement.',
    price: 0,
    priceType: 'trade',
    condition: 'good',
    conditionNotes: 'Established beds ready to plant',
    city: 'Phoenix, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Garden+Plot'],
    status: 'active',
    createdAt: '2024-03-21',
    tags: ['gardening', 'community', 'sharing', 'outdoors'],
  },
  {
    id: 'listing011',
    userId: 'user004',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Quality Tool Set - Selling Duplicate',
    description: 'Professional-grade tool set includes hammer, wrenches, screwdrivers, level, tape measure, and more. Duplicates from estate sale. Excellent condition.',
    price: 95,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Clean, ready to use',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Tool+Set'],
    status: 'active',
    createdAt: '2024-03-13',
    tags: ['tools', 'professional', 'hardware', 'equipment'],
  },
  {
    id: 'listing012',
    userId: 'user005',
    categoryId: 'resumes',
    subcategory: 'Hire Talent',
    title: 'Freelance Writing & Editing Available',
    description: 'Experienced writer available for blog posts, web copy, editing, and content strategy. Quick turnaround, professional quality. Portfolio available.',
    price: 0,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: '$0.08-0.12 per word typical',
    city: 'Tucson, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Writing+Services'],
    status: 'active',
    createdAt: '2024-03-18',
    tags: ['freelance', 'writing', 'content', 'editing'],
  },
  {
    id: 'listing013',
    userId: 'user008',
    categoryId: 'freestuff',
    subcategory: 'Giveaways',
    title: 'Free - Perennial Plants & Seeds',
    description: 'Spring plant division! Free perennial divisions including coneflowers, daylilies, and sedum. Also wildflower seed packets. Perfect for expanding your garden.',
    price: 0,
    priceType: 'free',
    condition: 'good',
    conditionNotes: 'Freshly divided, ready to plant',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Plants+Seeds'],
    status: 'active',
    createdAt: '2024-03-22',
    tags: ['plants', 'gardening', 'free', 'flowers'],
  },
  {
    id: 'listing014',
    userId: 'user002',
    categoryId: 'barter',
    subcategory: 'Trade Goods',
    title: 'Camera Equipment Trade - Looking for Lens',
    description: 'Have Canon EOS Rebel camera (with 18-55mm lens). Interested in trading for a telephoto lens (70-300mm range). Equipment in great condition.',
    price: 0,
    priceType: 'trade',
    condition: 'good',
    conditionNotes: 'Well-maintained, comes with bag and strap',
    city: 'Flagstaff, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Camera+Equipment'],
    status: 'active',
    createdAt: '2024-03-16',
    tags: ['camera', 'photography', 'equipment', 'trade'],
  },
  {
    id: 'listing015',
    userId: 'user001',
    categoryId: 'shows',
    subcategory: 'Events',
    title: 'Spring Art Market - Vendor Spaces Available',
    description: 'Local Spring Art Market seeking vendors! Space for 15 artists. Community park venue, great foot traffic. Reasonable booth fees. Interested artists contact ASAP.',
    price: 35,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: 'April 20th event',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Art+Market'],
    status: 'active',
    createdAt: '2024-03-11',
    tags: ['event', 'art', 'community', 'vendor'],
  },
  {
    id: 'listing016',
    userId: 'user003',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Sewing Machine - Singer Heavy Duty',
    description: 'Singer Heavy Duty sewing machine. Works perfectly, includes presser feet, threading guide, and manual. Not needed anymore.',
    price: 120,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: 'Fully functional, minor cosmetic wear',
    city: 'Sedona, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Sewing+Machine'],
    status: 'active',
    createdAt: '2024-03-15',
    tags: ['sewing', 'crafts', 'equipment', 'hobby'],
  },
  {
    id: 'listing017',
    userId: 'user004',
    categoryId: 'housing',
    subcategory: 'Rent',
    title: 'Studio Apartment - Monthly Lease Available',
    description: 'Cozy furnished studio in historic building. Utilities included. Month-to-month lease available. Perfect for someone new to Prescott or temporary stay.',
    price: 550,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: 'Recently updated, move-in ready',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Studio+Apartment'],
    status: 'active',
    createdAt: '2024-03-09',
    tags: ['housing', 'rental', 'apartment', 'monthly'],
  },
  {
    id: 'listing018',
    userId: 'user006',
    categoryId: 'barter',
    subcategory: 'Skills Swap',
    title: 'Music Lessons Trade - Looking for Carpentry Help',
    description: 'Offering piano lessons (beginner/intermediate) in exchange for carpentry work. Want to build simple shelving in music room. Lessons valued at $30/hour.',
    price: 0,
    priceType: 'trade',
    condition: 'good',
    conditionNotes: '30-minute to 1-hour sessions',
    city: 'Phoenix, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Piano+Lessons'],
    status: 'active',
    createdAt: '2024-03-19',
    tags: ['music', 'lessons', 'trade', 'skills'],
  },
  {
    id: 'listing019',
    userId: 'user007',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Vintage Cookbook Collection - Food History',
    description: '25+ vintage and antique cookbooks dating back to 1920s-1980s. Great for cooking, collecting, or display. Includes regional recipes and culinary history.',
    price: 75,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Pages yellowed from age but content clear',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Vintage+Cookbooks'],
    status: 'active',
    createdAt: '2024-03-17',
    tags: ['books', 'vintage', 'cooking', 'collectible'],
  },
  {
    id: 'listing020',
    userId: 'user002',
    categoryId: 'jobs',
    subcategory: 'Gigs',
    title: 'Seeking - Website Designer for Small Project',
    description: 'Small business seeking freelance web designer for simple 5-page website. Budget: $400-600. Timeline: 3-4 weeks. Portfolio required.',
    price: 500,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Project-based gig work',
    city: 'Tucson, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Web+Design+Gig'],
    status: 'active',
    createdAt: '2024-03-20',
    tags: ['job', 'freelance', 'web-design', 'gig'],
  },
  {
    id: 'listing021',
    userId: 'user005',
    categoryId: 'community',
    subcategory: 'Groups',
    title: 'Writing Group - Weekly Meetups',
    description: 'Join our casual writing group meeting every Thursday evening. All levels welcome. Free to join, casual atmosphere. Currently 8 members.',
    price: 0,
    priceType: 'free',
    condition: 'good',
    conditionNotes: 'Meet at local coffee shop',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Writing+Group'],
    status: 'active',
    createdAt: '2024-03-21',
    tags: ['community', 'group', 'writing', 'meetup'],
  },
  {
    id: 'listing022',
    userId: 'user008',
    categoryId: 'barter',
    subcategory: 'Skills Swap',
    title: 'Gardening Expertise Trade - Need House Cleaning Help',
    description: 'Offering gardening design consultation and plant recommendations. Looking for someone to help with spring house cleaning. Can arrange trades.',
    price: 0,
    priceType: 'trade',
    condition: 'good',
    conditionNotes: 'Half-day of work per side',
    city: 'Flagstaff, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Gardening+Trade'],
    status: 'active',
    createdAt: '2024-03-22',
    tags: ['gardening', 'trade', 'services', 'skills'],
  },
  {
    id: 'listing023',
    userId: 'user001',
    categoryId: 'trade',
    subcategory: 'Buy/Sell',
    title: 'Original Acrylic Paintings - Local Artist',
    description: 'Set of 3 original acrylic paintings featuring Arizona landscapes. 16x20 inch canvases. Beautiful addition to any home. Artist offers framing suggestions.',
    price: 150,
    priceType: 'negotiable',
    condition: 'new',
    conditionNotes: 'Recently completed, never framed or displayed',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Original+Paintings'],
    status: 'active',
    createdAt: '2024-03-16',
    tags: ['art', 'paintings', 'local-artist', 'decor'],
  },
  {
    id: 'listing024',
    userId: 'user004',
    categoryId: 'freestuff',
    subcategory: 'Donations',
    title: 'Free - Building Materials - Clear Out',
    description: 'Various leftover building materials from recent projects. Wood scraps, PVC pipes, hinges, door frame, misc hardware. Good for repairs or creative projects.',
    price: 0,
    priceType: 'free',
    condition: 'used',
    conditionNotes: 'Usable quality, must organize yourself',
    city: 'Sedona, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Building+Materials'],
    status: 'active',
    createdAt: '2024-03-21',
    tags: ['materials', 'free', 'building', 'diy'],
  },
  {
    id: 'listing025',
    userId: 'user007',
    categoryId: 'collections',
    subcategory: 'Vinyl & Records',
    title: 'Vintage Vinyl Collection — 60s & 70s Rock',
    description: 'Over 40 vinyl records from the golden era of rock. Includes Led Zeppelin, Pink Floyd, The Doors, Hendrix, and more. Most in VG+ condition with original sleeves.',
    price: 220,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Some sleeve wear, vinyl plays great',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Vinyl+Collection'],
    status: 'active',
    createdAt: '2024-03-23',
    tags: ['vinyl', 'records', 'music', 'vintage', 'collection'],
  },
  {
    id: 'listing026',
    userId: 'user002',
    categoryId: 'collections',
    subcategory: 'Comics & Cards',
    title: 'Baseball Card Collection — 1980s-90s Lot',
    description: 'Lot of 200+ baseball cards from the 80s and 90s. Includes several rookie cards and hall-of-famers. Stored in sleeves and binder. Great starter collection.',
    price: 85,
    priceType: 'fixed',
    condition: 'good',
    conditionNotes: 'Cards in protective sleeves, binder included',
    city: 'Phoenix, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Baseball+Cards'],
    status: 'active',
    createdAt: '2024-03-22',
    tags: ['cards', 'baseball', 'sports', 'collectible', 'vintage'],
  },
  {
    id: 'listing027',
    userId: 'user001',
    categoryId: 'collections',
    subcategory: 'Antiques',
    title: 'Antique Pottery Collection — Southwest Style',
    description: 'Curated set of 8 handmade southwest pottery pieces. Various sizes and styles from local artisans. Beautiful earth tones perfect for display or gifting.',
    price: 175,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Minor age-related patina, no chips or cracks',
    city: 'Sedona, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Southwest+Pottery'],
    status: 'active',
    createdAt: '2024-03-20',
    tags: ['pottery', 'southwest', 'antique', 'handmade', 'collection'],
  },
  {
    id: 'listing028',
    userId: 'user005',
    categoryId: 'collections',
    subcategory: 'Art Prints',
    title: 'Limited Edition Art Print Bundle — Arizona Landscapes',
    description: 'Set of 5 signed limited-edition prints featuring Arizona landscapes. Each print is 11x14, numbered, and comes with certificate of authenticity.',
    price: 120,
    priceType: 'fixed',
    condition: 'new',
    conditionNotes: 'Mint condition, never framed',
    city: 'Prescott, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Art+Prints'],
    status: 'active',
    createdAt: '2024-03-24',
    tags: ['art', 'prints', 'arizona', 'landscape', 'limited-edition'],
  },
  {
    id: 'listing029',
    userId: 'user008',
    categoryId: 'collections',
    subcategory: 'Coins & Stamps',
    title: 'US Coin Collection — Silver Dollars & Half Dollars',
    description: 'Collection of 15 US silver coins including Morgan dollars, Peace dollars, and Walking Liberty half dollars. Various dates from 1878-1964.',
    price: 350,
    priceType: 'negotiable',
    condition: 'good',
    conditionNotes: 'Circulated condition, genuine silver',
    city: 'Flagstaff, AZ',
    photos: ['https://placehold.co/400x300/1E2330/A0A8BE?text=Silver+Coins'],
    status: 'active',
    createdAt: '2024-03-19',
    tags: ['coins', 'silver', 'numismatic', 'vintage', 'collection'],
  },
];

const OFFERS = [
  {
    id: 'offer001',
    listingId: 'listing001',
    buyerId: 'user002',
    offerAmount: 40,
    tradeDescription: null,
    status: 'pending',
    message: 'Really love this piece! Would you consider $40?',
    createdAt: '2024-03-24',
  },
  {
    id: 'offer002',
    listingId: 'listing002',
    buyerId: 'user006',
    offerAmount: 0,
    tradeDescription: 'Can offer 10 guitar lessons in exchange for website design',
    status: 'accepted',
    message: 'Perfect! I have 10 lessons available and would love a website.',
    createdAt: '2024-03-23',
  },
  {
    id: 'offer003',
    listingId: 'listing003',
    buyerId: 'user005',
    offerAmount: 625,
    tradeDescription: null,
    status: 'countered',
    message: 'Interested but need it lower',
    createdAt: '2024-03-22',
  },
  {
    id: 'offer004',
    listingId: 'listing004',
    buyerId: 'user003',
    offerAmount: 0,
    tradeDescription: 'Trade: Website update for deck repair estimate',
    status: 'pending',
    message: 'Would you consider trading deck work for updating my business website?',
    createdAt: '2024-03-23',
  },
  {
    id: 'offer005',
    listingId: 'listing007',
    buyerId: 'user005',
    offerAmount: 150,
    tradeDescription: null,
    status: 'pending',
    message: 'Interested in the vintage Trek. Can you do $150?',
    createdAt: '2024-03-24',
  },
  {
    id: 'offer006',
    listingId: 'listing008',
    buyerId: 'user002',
    offerAmount: 30,
    tradeDescription: null,
    status: 'declined',
    message: 'Can you do $30 per lesson?',
    createdAt: '2024-03-22',
  },
  {
    id: 'offer007',
    listingId: 'listing011',
    buyerId: 'user003',
    offerAmount: 80,
    tradeDescription: null,
    status: 'pending',
    message: 'Would you go down to $80 for the tools?',
    createdAt: '2024-03-24',
  },
  {
    id: 'offer008',
    listingId: 'listing016',
    buyerId: 'user001',
    offerAmount: 100,
    tradeDescription: null,
    status: 'countered',
    message: 'Interested! Can you do $100?',
    createdAt: '2024-03-23',
  },
  {
    id: 'offer009',
    listingId: 'listing019',
    buyerId: 'user007',
    offerAmount: 60,
    tradeDescription: null,
    status: 'pending',
    message: 'Love cookbooks! Would $60 work?',
    createdAt: '2024-03-24',
  },
  {
    id: 'offer010',
    listingId: 'listing023',
    buyerId: 'user003',
    offerAmount: 120,
    tradeDescription: null,
    status: 'pending',
    message: 'Beautiful paintings! Would you take $120 for all three?',
    createdAt: '2024-03-23',
  },
  {
    id: 'offer011',
    listingId: 'listing014',
    buyerId: 'user001',
    offerAmount: 0,
    tradeDescription: 'Have Canon 70-300mm lens, willing to trade straight across',
    status: 'accepted',
    message: 'Perfect match! I have exactly the lens you want.',
    createdAt: '2024-03-22',
  },
];

// ─────────────────────────────────────────────
// Seed functions
// ─────────────────────────────────────────────

async function seedCategories() {
  console.log('\n[1/4] Seeding categories...');

  const rows = CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    is_hot: c.isHot,
    subcategories: c.subcategories,
  }));

  const { error } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('  Error seeding categories:', error.message);
  } else {
    console.log(`  Upserted ${rows.length} categories.`);
  }
}

async function seedUsers(): Promise<Record<string, string>> {
  console.log('\n[2/4] Creating auth users and updating profiles...');

  const userIdMap: Record<string, string> = {};

  for (const user of USERS) {
    const email = `${user.id}@tradehub-seed.local`;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'seedpassword123',
      email_confirm: true,
    });

    if (authError) {
      // If the user already exists, try to look them up
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        console.warn(`  User ${user.id} (${email}) already exists — looking up UUID...`);

        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.error(`  Could not list users: ${listError.message}`);
          continue;
        }

        const existing = listData.users.find((u) => u.email === email);
        if (existing) {
          userIdMap[user.id] = existing.id;
          console.log(`  Mapped ${user.id} → ${existing.id} (existing)`);

          // Upsert profile — the trigger may not have fired for pre-existing auth users
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existing.id,
              display_name: user.displayName,
              avatar_initials: user.avatarInitials,
              city: user.city,
              bio: user.bio,
              is_verified: user.isVerified,
              rating_avg: user.ratingAvg,
              review_count: user.reviewCount,
              trust_score: user.trustScore,
              response_rate: user.responseRate,
              listing_count: user.listingCount,
              joined_at: user.joinedAt,
            });

          if (profileError) {
            console.error(`  Error upserting profile for ${user.id}: ${profileError.message}`);
          } else {
            console.log(`  Upserted profile for ${user.id} (${user.displayName})`);
          }
        } else {
          console.error(`  Could not find existing user for ${email}`);
        }
      } else {
        console.error(`  Error creating auth user ${user.id}: ${authError.message}`);
      }
      continue;
    }

    const newUuid = authData.user.id;
    userIdMap[user.id] = newUuid;
    console.log(`  Created auth user ${user.id} → ${newUuid}`);

    // Upsert profile with full mock data (handles cases where trigger didn't fire)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUuid,
        display_name: user.displayName,
        avatar_initials: user.avatarInitials,
        city: user.city,
        bio: user.bio,
        is_verified: user.isVerified,
        rating_avg: user.ratingAvg,
        review_count: user.reviewCount,
        trust_score: user.trustScore,
        response_rate: user.responseRate,
        listing_count: user.listingCount,
        joined_at: user.joinedAt,
      });

    if (profileError) {
      console.error(`  Error upserting profile for ${user.id}: ${profileError.message}`);
    } else {
      console.log(`  Upserted profile for ${user.id} (${user.displayName})`);
    }
  }

  return userIdMap;
}

async function seedListings(userIdMap: Record<string, string>): Promise<Record<string, string>> {
  console.log('\n[3/4] Seeding listings...');

  const listingIdMap: Record<string, string> = {};
  const rows = [];

  for (const listing of LISTINGS) {
    const userId = userIdMap[listing.userId];
    if (!userId) {
      console.warn(`  Skipping listing ${listing.id}: no UUID found for user ${listing.userId}`);
      continue;
    }

    rows.push({
      user_id: userId,
      category_id: listing.categoryId,
      subcategory: listing.subcategory,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      price_type: listing.priceType,
      condition: listing.condition,
      condition_notes: listing.conditionNotes,
      city: listing.city,
      photos: listing.photos,
      status: listing.status,
      created_at: listing.createdAt,
      tags: listing.tags,
      // _mockId is not a DB column — stored separately for mapping
      _mockId: listing.id,
    });
  }

  // Insert one at a time to capture returned IDs for the listingIdMap
  for (const row of rows) {
    const mockId = row._mockId;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _mockId: _removed, ...dbRow } = row;

    const { data, error } = await supabase
      .from('listings')
      .insert(dbRow)
      .select('id')
      .single();

    if (error) {
      console.error(`  Error inserting listing ${mockId}: ${error.message}`);
    } else {
      listingIdMap[mockId] = data.id;
      console.log(`  Inserted listing ${mockId} → ${data.id}`);
    }
  }

  return listingIdMap;
}

async function seedOffers(
  userIdMap: Record<string, string>,
  listingIdMap: Record<string, string>
) {
  console.log('\n[4/4] Seeding offers...');

  for (const offer of OFFERS) {
    const listingId = listingIdMap[offer.listingId];
    const buyerId = userIdMap[offer.buyerId];

    if (!listingId) {
      console.warn(`  Skipping offer ${offer.id}: no DB ID for listing ${offer.listingId}`);
      continue;
    }
    if (!buyerId) {
      console.warn(`  Skipping offer ${offer.id}: no UUID for buyer ${offer.buyerId}`);
      continue;
    }

    const { error } = await supabase.from('offers').insert({
      listing_id: listingId,
      buyer_id: buyerId,
      offer_amount: offer.offerAmount,
      trade_description: offer.tradeDescription,
      status: offer.status,
      message: offer.message,
      created_at: offer.createdAt,
    });

    if (error) {
      console.error(`  Error inserting offer ${offer.id}: ${error.message}`);
    } else {
      console.log(`  Inserted offer ${offer.id}`);
    }
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log('Starting TradeHub seed script...');
  console.log(`Supabase URL: ${supabaseUrl}`);

  await seedCategories();
  const userIdMap = await seedUsers();
  const listingIdMap = await seedListings(userIdMap);
  await seedOffers(userIdMap, listingIdMap);

  console.log('\nSeed complete!');
  console.log(`  Users mapped: ${Object.keys(userIdMap).length}`);
  console.log(`  Listings mapped: ${Object.keys(listingIdMap).length}`);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
