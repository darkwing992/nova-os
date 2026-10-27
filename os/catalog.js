// Everything the Nova Store knows about.
// kind: "system" = built into the OS, "local" = runs from os/apps, "web" = a website that runs as an app
// preinstalled: comes on the console out of the box
const CATALOG = [
  // ---- system ----
  { id: 'web', name: 'Web', type: 'app', kind: 'system', icon: '🌐', color: '#1f6feb,#00d4ff', preinstalled: true, system: true,
    desc: 'Browse the internet with bookmarks and a controller-friendly start page.' },
  { id: 'store', name: 'Nova Store', type: 'app', kind: 'system', icon: '🛍️', color: '#7c5cff,#ff5cc8', preinstalled: true, system: true,
    desc: 'Find and install new games and apps.' },
  { id: 'settings', name: 'Settings', type: 'app', kind: 'system', icon: '⚙️', color: '#3a3f5c,#626a99', preinstalled: true, system: true,
    desc: 'Change your profile, wallpaper and system options.' },

  // ---- preinstalled games ----
  { id: 'snake', name: 'Neon Snake', type: 'game', kind: 'local', src: 'apps/snake.html', icon: '🐍', color: '#00b36b,#00e0a4', preinstalled: true, size: '1.2 MB', dev: 'Nova Studios',
    desc: 'Eat glowing orbs, grow longer and don\'t bite your own tail. Speeds up as you go.' },
  { id: 'breaker', name: 'Brick Breaker', type: 'game', kind: 'local', src: 'apps/breaker.html', icon: '🧱', color: '#ff6b35,#ffb347', preinstalled: true, size: '1.6 MB', dev: 'Nova Studios',
    desc: 'Bounce the ball, smash every brick and catch power-ups across endless levels.' },
  { id: 'astro', name: 'Astro Dodge', type: 'game', kind: 'local', src: 'apps/astro.html', icon: '🚀', color: '#2b1055,#7597de', preinstalled: true, size: '2.1 MB', dev: 'Nova Studios',
    desc: 'Fly through an asteroid field and blast rocks. How long can you survive?' },

  // ---- preinstalled apps ----
  { id: 'notes', name: 'Notes', type: 'app', kind: 'local', src: 'apps/notes.html', icon: '📝', color: '#f7b733,#fc4a1a', preinstalled: true, size: '0.4 MB', dev: 'Nova',
    desc: 'Write things down. Notes save automatically.' },
  { id: 'files', name: 'Files', type: 'app', kind: 'local', src: 'apps/files.html', icon: '📁', color: '#3a7bd5,#3a6073', preinstalled: true, size: '0.5 MB', dev: 'Nova',
    desc: 'See your saved data, notes, drawings and installed apps.' },

  // ---- in the store ----
  { id: 'memory', name: 'Memory Match', type: 'game', kind: 'local', src: 'apps/memory.html', icon: '🃏', color: '#8e2de2,#4a00e0', size: '0.9 MB', dev: 'Nova Studios',
    desc: 'Flip cards and find all the pairs in as few moves as you can.' },
  { id: 'paddle', name: 'Paddle Duel', type: 'game', kind: 'local', src: 'apps/paddle.html', icon: '🏓', color: '#0f2027,#2c5364', size: '0.8 MB', dev: 'Nova Studios',
    desc: 'Classic paddle-and-ball. Play the computer or a friend on the same keyboard.' },
  { id: 'paint', name: 'Paint', type: 'app', kind: 'local', src: 'apps/paint.html', icon: '🎨', color: '#ee0979,#ff6a00', size: '0.7 MB', dev: 'Nova',
    desc: 'Draw with brushes and colors. Save your art to Files.' },
  { id: 'calc', name: 'Calculator', type: 'app', kind: 'local', src: 'apps/calc.html', icon: '🧮', color: '#232526,#414345', size: '0.2 MB', dev: 'Nova',
    desc: 'A big, simple calculator.' },
  { id: 'synth', name: 'Synth Pad', type: 'app', kind: 'local', src: 'apps/synth.html', icon: '🎹', color: '#fc466b,#3f5efb', size: '0.6 MB', dev: 'Nova',
    desc: 'Play music on a keyboard synth with different sounds.' },

  // ---- web apps ----
  { id: 'youtube', name: 'YouTube', type: 'web', kind: 'web', url: 'https://www.youtube.com/tv', icon: '▶️', color: '#c4302b,#ff4e45', size: 'Web', dev: 'Web app',
    desc: 'Watch videos in the big-screen TV layout.' },
  { id: 'wikipedia', name: 'Wikipedia', type: 'web', kind: 'web', url: 'https://en.wikipedia.org', icon: '📚', color: '#555,#999', size: 'Web', dev: 'Web app',
    desc: 'The free encyclopedia.' },
  { id: 'maps', name: 'Maps', type: 'web', kind: 'web', url: 'https://www.openstreetmap.org', icon: '🗺️', color: '#2f9e44,#74c0fc', size: 'Web', dev: 'Web app',
    desc: 'Explore the world map.' },
  { id: 'twitch', name: 'Twitch', type: 'web', kind: 'web', url: 'https://www.twitch.tv', icon: '📺', color: '#6441a5,#9146ff', size: 'Web', dev: 'Web app',
    desc: 'Watch live game streams.' },
  { id: 'spotify', name: 'Spotify', type: 'web', kind: 'web', url: 'https://open.spotify.com', icon: '🎵', color: '#1db954,#191414', size: 'Web', dev: 'Web app',
    desc: 'Listen to music and podcasts.' },
  { id: 'xcloud', name: 'Xbox Cloud Gaming', type: 'web', kind: 'web', url: 'https://www.xbox.com/play', icon: '☁️', color: '#107c10,#3dbd3d', size: 'Web', dev: 'Web app',
    desc: 'Stream games from the cloud (needs a Game Pass account).' },
];
