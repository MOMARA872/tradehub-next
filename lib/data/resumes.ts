export interface ResumeExperience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface ResumeEducation {
  degree: string;
  school: string;
  year: string;
}

export interface Resume {
  id: string;
  userId: string;
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  availability: string;
  desiredRole: string;
  isPublic: boolean;
  createdAt: string;
}

export const RESUMES: Resume[] = [
  {
    id: 'resume001', userId: 'user005', name: 'Lisa Zhang', headline: 'Freelance Writer & Content Strategist',
    summary: 'Experienced writer with 8+ years in content marketing, blog writing, SEO, and editorial. Published in multiple outlets.',
    skills: ['Content Writing', 'SEO', 'Copyediting', 'Blog Management', 'Social Media', 'WordPress'],
    experience: [
      { title: 'Freelance Writer', company: 'Self-Employed', period: '2020 – Present', description: 'Blog posts, web copy, and content strategy for small businesses.' },
      { title: 'Content Editor', company: 'Desert Media Co', period: '2017 – 2020', description: 'Managed editorial calendar and team of 4 writers.' },
    ],
    education: [{ degree: 'BA English Literature', school: 'ASU', year: '2016' }],
    availability: 'Available Now', desiredRole: 'Content Writer / Editor', isPublic: true, createdAt: '2024-03-10',
  },
  {
    id: 'resume002', userId: 'user002', name: 'James Chen', headline: 'Full-Stack Web Developer',
    summary: 'Passionate developer with expertise in React, Node.js, and Python. 6 years building modern web applications.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'AWS'],
    experience: [
      { title: 'Senior Developer', company: 'TechStart AZ', period: '2021 – Present', description: 'Lead developer on SaaS products serving 10k+ users.' },
      { title: 'Web Developer', company: 'Freelance', period: '2018 – 2021', description: 'Built custom sites and web apps for local businesses.' },
    ],
    education: [{ degree: 'BS Computer Science', school: 'NAU', year: '2018' }],
    availability: 'Open to Opportunities', desiredRole: 'Senior Developer / Tech Lead', isPublic: true, createdAt: '2024-03-15',
  },
  {
    id: 'resume003', userId: 'user004', name: 'Marcus Johnson', headline: 'Licensed Carpenter & General Contractor',
    summary: '15+ years of experience in residential construction, deck building, and renovation. Licensed, insured, and locally trusted.',
    skills: ['Carpentry', 'Deck Building', 'Renovation', 'Plumbing Basics', 'Project Management', 'Blueprint Reading'],
    experience: [
      { title: 'Owner / Contractor', company: 'Johnson Home Services', period: '2015 – Present', description: 'Full-service home repair and construction for Prescott area.' },
      { title: 'Carpenter', company: 'Yavapai Builders', period: '2009 – 2015', description: 'Custom home builds and commercial renovations.' },
    ],
    education: [{ degree: 'Carpentry Certificate', school: 'Prescott Trade School', year: '2009' }],
    availability: 'Available for Projects', desiredRole: 'Contractor / Project Lead', isPublic: true, createdAt: '2024-03-12',
  },
];
