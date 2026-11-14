// Everything the portfolio says lives in this file.
// Edit the text, save, and upload the file to GitHub again.

export const PROFILE = {
  name: 'Srayan Talukdar',
  firstName: 'Srayan',
  role: 'AI & Data student · Aivancity',
  introLine: 'AI & Data student at Aivancity, with a background in aircraft maintenance engineering.',
  status: 'Looking for a 2–3 month summer internship in Data / AI in 2027, in France or abroad.',
  location: 'Paris area, France',
  // The email is split in two so simple spam bots can't read it from the page source.
  emailUser: 'srayanmoitra66',
  emailDomain: 'gmail.com',
  // Paste your links here when you have them; empty links are hidden.
  linkedin: '', // e.g. 'https://www.linkedin.com/in/your-profile'
  github: 'https://github.com/VaporScope',
};

export const ABOUT = {
  title: "Hi, I'm Srayan.",
  paragraphs: [
    "I'm a first-year Programme Grande École student in Artificial Intelligence & Data at Aivancity, near Paris.",
    'Before AI, I studied Aircraft Maintenance Engineering in India (2021–2023), then did a preparatory year at IPSA, an aerospace engineering school in Ivry-sur-Seine.',
    "Aviation taught me to follow procedures, check my work and take safety seriously. I bring that rigor to data and AI projects, and I'm good at getting reliable results out of AI tools through prompt engineering.",
  ],
  facts: [
    ['Based in', 'Paris area, France'],
    ['Studying', 'AI & Data at Aivancity (2026 – present)'],
    ['Languages', 'English (fluent), French (A1)'],
    ['Interests', 'Aviation, new AI tools, tennis, golf'],
  ],
};

export const PROJECTS = [
  {
    name: 'Surf AI',
    subtitle: 'AI chatbot with live web search',
    date: 'May 2026',
    url: 'https://asksurf.base44.app',
    urlLabel: 'Try it live',
    summary: 'A chat assistant that answers questions with up-to-date information from the web.',
    points: [
      'Wrote the Python backend with Claude as an AI coding assistant, connecting the OpenAI API (answers) to SerpAPI (live Google search results).',
      'Hosted the code on GitHub, deployed the backend on Render and built the chat interface with Base44.',
      'Multi-turn conversations saved across sessions, file and image attachments, read-aloud replies, and Google, Microsoft or guest sign-in.',
    ],
    tags: ['Python', 'OpenAI API', 'SerpAPI', 'Prompt engineering', 'GitHub', 'Render', 'Base44'],
  },
  {
    name: 'This portfolio',
    subtitle: 'Interactive 3D cockpit',
    date: 'Nov 2026',
    url: 'https://github.com/VaporScope/VaporScope.github.io',
    urlLabel: 'View the code',
    summary: 'A cockpit you can sit in, right in the browser. The center display runs a small desktop with my portfolio.',
    points: [
      'Built with Three.js and plain HTML, CSS and JavaScript, with Claude as a coding assistant.',
      'The whole cockpit is generated in code, with no 3D model files.',
      'Hosted for free on GitHub Pages.',
    ],
    tags: ['Three.js', 'JavaScript', 'HTML / CSS', 'GitHub Pages'],
  },
];

export const EDUCATION = [
  {
    years: '2026 – present',
    title: 'Programme Grande École, Artificial Intelligence & Data',
    place: 'Aivancity · Villejuif, France',
    detail: 'Python programming, statistics, mathematics for AI, data analysis, business fundamentals, AI ethics',
  },
  {
    years: '2025 – 2026',
    title: 'Integrated preparatory cycle',
    place: 'IPSA, aerospace engineering school · Ivry-sur-Seine, France',
    detail: 'Mathematics, physics, mechanics, introduction to aerospace engineering',
  },
  {
    years: '2021 – 2023',
    title: 'Aircraft Maintenance Engineering (AME)',
    place: 'Indraprasth Institute of Aeronautics · Delhi, India',
    detail: 'Aircraft systems, airframes and engines, maintenance procedures, technical documentation, aviation safety regulations',
  },
];

export const SKILLS = [
  {
    group: 'AI tools & prompt engineering',
    items: ['ChatGPT', 'Claude', 'Gemini', 'Microsoft Copilot', 'Perplexity', 'Structured prompts', 'Checking AI output'],
  },
  {
    group: 'Code & data',
    items: ['Python', 'OpenAI API', 'SerpAPI', 'GitHub', 'Render', 'Base44', 'Excel / Google Sheets', 'Power BI'],
  },
  {
    group: 'Office & design',
    items: ['Microsoft Office', 'Google Workspace', 'Canva'],
  },
  {
    group: 'Aviation',
    items: ['Aircraft systems', 'Technical manuals & drawings', 'Maintenance procedures', 'Safety & quality standards'],
  },
  {
    group: 'Soft skills',
    items: ['Rigor', 'Attention to detail', 'Adaptability', 'Teamwork', 'Quick learner'],
  },
];

export const CV_FILES = [
  { label: 'English', file: 'CV_Srayan_Talukdar_EN.pdf' },
  { label: 'Français', file: 'CV_Srayan_Talukdar_FR.pdf' },
];

// Waypoints drawn on the navigation display in the cockpit.
export const ROUTE = ['AIVC', 'BUILD', 'INTRN'];
