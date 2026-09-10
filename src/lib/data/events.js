export const events = [
  {
    id: 'nexus-summit-2026',
    name: 'Nexus Summit 2026',
    subtitle: 'The conference for builders shaping what comes next.',
    status: 'Live · Sep 22–24 · Barcelona',
    dates: 'Sep 22–24, 2026',
    location: 'Barcelona, Spain',
    itemCount: 22,
    accent: '#8B5CF6',
    nextUp: {
      title: 'The Future of Human-Computer Interaction',
      speaker: 'Marisol Chen',
      time: '09:00 → 10:30',
      location: 'Main Stage',
      track: 'keynote'
    },
    activities: [
      { id: 'nexus-a1', title: 'Building Real-time Systems at Scale', speaker: 'Arjun Patel', time: '10:45', location: 'Hall A', track: 'tech' },
      { id: 'nexus-a2', title: 'Designing for Emerging Interfaces', speaker: 'Sofia Reyes', time: '10:45', location: 'Hall B', track: 'design' },
      { id: 'nexus-a3', title: 'AI-Powered Prototyping Workshop', speaker: 'James Kim', time: '12:00', location: 'Workshop 1', track: 'workshop' },
      { id: 'nexus-a4', title: 'Rust in Production: Lessons Learned', speaker: 'Dmitri Volkov', time: '14:00', location: 'Hall A', track: 'tech' }
    ],
    members: [
      { name: 'You', initials: 'YO', role: 'Full Stack Dev', color: '#A78BFA', activities: 8 },
      { name: 'Ana', initials: 'AG', role: 'UX Designer', color: '#F472B6', activities: 7 },
      { name: 'Lucas', initials: 'LF', role: 'Backend Engineer', color: '#34D399', activities: 7 },
      { name: 'Maya', initials: 'MP', role: 'Product Manager', color: '#FBBF24', activities: 7 }
    ]
  },
  {
    id: 'confuror-2026',
    name: 'Confuror 2026',
    subtitle: 'Sombras del Oeste · comunidad, talleres y creatividad.',
    status: 'Upcoming · Oct 16–18 · Guadalajara',
    dates: 'Oct 16–18, 2026',
    location: 'Guadalajara, Mexico',
    itemCount: 48,
    accent: '#F472B6',
    nextUp: {
      title: 'Opening Ceremony & Community Welcome',
      speaker: 'Confuror Team',
      time: '10:00 → 11:00',
      location: 'Main Hall',
      track: 'keynote'
    },
    activities: [
      { id: 'confuror-c1', title: 'Fursuit Building 101', speaker: 'Kira Fox', time: '11:15', location: 'Workshop A', track: 'workshop' },
      { id: 'confuror-c2', title: 'Artist Alley Meet & Greet', speaker: 'Community', time: '12:30', location: 'Expo Hall', track: 'design' },
      { id: 'confuror-c3', title: 'Dance Competition', speaker: 'Confuror Team', time: '15:00', location: 'Main Hall', track: 'keynote' },
      { id: 'confuror-c4', title: 'Late Night Makers Meetup', speaker: 'Community', time: '20:00', location: 'Lounge', track: 'tech' }
    ],
    members: [
      { name: 'You', initials: 'YO', role: 'Attendee', color: '#F472B6', activities: 5 },
      { name: 'Alex', initials: 'AR', role: 'Artist', color: '#FBBF24', activities: 6 },
      { name: 'Sam', initials: 'SM', role: 'Volunteer', color: '#34D399', activities: 8 },
      { name: 'Jules', initials: 'JL', role: 'Maker', color: '#60A5FA', activities: 4 }
    ]
  },
  {
    id: 'edge-days-2026',
    name: 'Edge Days 2026',
    subtitle: 'Three days of practical ideas for the distributed web.',
    status: 'Upcoming · Nov 05–07 · Lisbon',
    dates: 'Nov 05–07, 2026',
    location: 'Lisbon, Portugal',
    itemCount: 31,
    accent: '#34D399',
    nextUp: {
      title: 'Edge Computing: Beyond the Buzzword',
      speaker: 'Chen Wei',
      time: '09:30 → 10:30',
      location: 'Auditorium',
      track: 'tech'
    },
    activities: [
      { id: 'edge-e1', title: 'Building for the Edge', speaker: 'Chen Wei', time: '10:45', location: 'Auditorium', track: 'tech' },
      { id: 'edge-e2', title: 'Designing Calm Infrastructure', speaker: 'Marta Silva', time: '12:00', location: 'Studio B', track: 'design' },
      { id: 'edge-e3', title: 'Hands-on Workers Workshop', speaker: 'João Costa', time: '14:00', location: 'Lab 1', track: 'workshop' },
      { id: 'edge-e4', title: 'The Future of Open Networks', speaker: 'Panel Discussion', time: '16:30', location: 'Auditorium', track: 'keynote' }
    ],
    members: [
      { name: 'You', initials: 'YO', role: 'Engineer', color: '#34D399', activities: 4 },
      { name: 'Nora', initials: 'NR', role: 'Platform Lead', color: '#A78BFA', activities: 6 },
      { name: 'Leo', initials: 'LE', role: 'Developer', color: '#60A5FA', activities: 5 },
      { name: 'Mina', initials: 'MN', role: 'Designer', color: '#F472B6', activities: 4 }
    ]
  }
];

export function getEvent(id) {
  return events.find((event) => event.id === id);
}
