// Public marketing content only. Never put HubSpot notes, private contacts or secrets here.
export const site = {
  demo: true,
  brand: 'FORGE',
  descriptor: 'PROPERTY SPECIALISTS',
  city: 'Johannesburg',
  eyebrow: 'CONSIDERED WORK. EXCEPTIONAL SPACES.',
  headline: ['A better home.', 'Built on trust.'],
  intro: 'From the first repair to the final detail. Thoughtful renovations, electrical work and property care, brought together under one roof.',
  title: 'FORGE — Property Specialists | ZionFlow Concept',
  description: 'Explore a premium local-service website concept by ZionFlow: renovations, electrical work, property care and a simple quote experience.',
  phone: null, // Verified E.164, e.g. +27…; null keeps a safe demo interaction.
  whatsapp: null, // Verified international digits only, no plus sign.
  canonical: null, // Set the real https URL only when approved for launch.
  heroImage: '/local-service-demo/images/architecture-1600.webp',
  heroImageSmall: '/local-service-demo/images/architecture-800.webp',
  heroAlt: 'Architectural concept of a contemporary charcoal home with warm lighting and a landscaped entrance',
  promises: ['A clear scope from the start', 'Care in every detail', 'One point of contact'],
  servicesIntro: 'One home. Every detail covered.',
  servicesDescription: 'The small fixes. The ambitious upgrades. A considered approach to the spaces you use every day.',
  services: [
    {id:'renovation', name:'Renovations & builds', description:'Make more of your space. From focused improvements to a complete rethink.', icon:'home', tags:'ALTERATIONS / UPGRADES'},
    {id:'electrical', name:'Electrical & lighting', description:'Practical power. Beautiful lighting. Plan your next installation or repair.', icon:'bolt', tags:'LIGHTING / INSTALLATIONS'},
    {id:'plumbing', name:'Plumbing & water', description:'Keep the essentials flowing, with repairs and considered bathroom upgrades.', icon:'drop', tags:'REPAIRS / BATHROOMS'},
    {id:'maintenance', name:'Property maintenance', description:'Give the jobs on your list the attention they deserve, inside and out.', icon:'tool', tags:'REPAIRS / PROPERTY CARE'},
    {id:'finishes', name:'Painting & finishes', description:'A fresh perspective, brought to life through colour, texture and detail.', icon:'layers', tags:'INTERIORS / EXTERIORS'},
    {id:'outdoor', name:'Outdoor improvements', description:'Connect your home to the outdoors with inviting, practical spaces.', icon:'sun', tags:'PATIOS / EXTERIORS'},
  ],
  project: {title:'A new perspective on home.', location:'RESIDENTIAL CONCEPT / JOHANNESBURG', description:'Warm light. Clean lines. A welcoming arrival. Explore how the different details of a home can work together.', details:[
    {title:'Build & space', text:'A clean architectural frame connects the living areas with a generous outdoor entrance.', x:69, y:40},
    {title:'Light & atmosphere', text:'Layered entrance and interior lighting adds warmth and makes everyday spaces more inviting.', x:82, y:62},
    {title:'Finish & detail', text:'Charcoal textures, natural planting and restrained materials bring the complete concept together.', x:53, y:73},
  ]},
  reviews: [
    {quote:'We knew what to expect at every stage. The whole process felt clear and considered.', author:'Homeowner', context:'Renovation experience'},
    {quote:'It is the small details that make the difference. Our home feels like our own again.', author:'Homeowner', context:'Home improvement experience'},
    {quote:'One conversation, a clear plan, and someone who understood what we wanted to achieve.', author:'Property owner', context:'Property care experience'},
  ],
  areas: ['Sandton', 'Rosebank', 'Randburg', 'Fourways', 'Bryanston', 'Midrand'],
  coverageHeading: 'Good work. Close to home.',
  coverageDescription: 'Explore this example service area around Johannesburg. Select your suburb to try the local coverage experience.',
  quoteHeading: 'Let’s make your space work better.',
  quoteIntro: 'A repair, a renovation, or an idea you are ready to explore. Start with a conversation.',
};

// Starter vocabulary when adapting for a prospect. Replace services, imagery and proof together.
export const industryPresets = {
  plumber: ['Leak repairs', 'Geysers', 'Bathrooms', 'Drain cleaning'],
  electrician: ['Electrical repairs', 'Lighting', 'Distribution boards', 'Backup power'],
  mechanic: ['Vehicle servicing', 'Diagnostics', 'Brakes', 'Repairs'],
  cleaner: ['Home cleaning', 'Office cleaning', 'Deep cleaning', 'Move-in cleaning'],
  contractor: ['Renovations', 'Building work', 'Painting', 'Property maintenance'],
  drivingSchool: ['Learner preparation', 'Driving lessons', 'Test preparation', 'Refresher lessons'],
};
