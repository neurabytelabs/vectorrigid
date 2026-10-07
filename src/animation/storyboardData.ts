import { AnimationScene, SoundEvent } from './types';

export const TOTAL_DURATION = 88; // 88 seconds (~1 min 28 sec, within 75-90s specification)

export const SCENES: AnimationScene[] = [
  {
    id: 1,
    title: 'SCENE 1: HOOK',
    subtitle: 'The Illusion of Solidity',
    startTime: 0,
    endTime: 12,
    learningPurpose:
      'Challenge the assumption that simulated video game objects are naturally solid, revealing that computers only understand floating-point numbers.',
    visual:
      'A miniature paper stage inside a deep charcoal terminal. Two torn-paper boxes in warm cream and mustard drop toward each other. The coral pixel mascot stands beside them, gasping as the top box passes ghostly straight through the other.',
    motion:
      'Entrance: Coral mascot hops in from stage left. Primary action: Two cardboard boxes fall; the top box phases ghost-like through the bottom box with zero resistance. Mascot tilts 15 degrees in bewilderment. Exit: Mascot taps on the overlapping intersection, turning it into a bright pencil sketch.',
    voiceover:
      'Look closely at your favorite game. That stone wall isn’t solid rock. To a computer, it is just empty numbers drifting in dark memory. Without rules, worlds dissolve.',
    soundCue:
      'Soft paper flutter as curtain opens, followed by a dull, hollow cardboard swish when the box phases through, and a quirky inquisitive chime.',
    transitionObject:
      'The ghostly overlapping zone between the two blocks sharpens into a pencil sketch of a single falling particle.',
    caption:
      'Look closely at your favorite game. That stone wall isn’t solid rock.',
  },
  {
    id: 2,
    title: 'SCENE 2: FAMILIAR WORLD',
    subtitle: 'The Lone Vector',
    startTime: 12,
    endTime: 24,
    learningPurpose:
      'Establish Newton’s first two laws in code: motion begins simply with position and velocity vectors stepping forward in time.',
    visual:
      'The pencil sketch turns into a cream paper ball floating against a gridded notebook stage. A bold coral velocity arrow springs from its center. Crayon tick marks record each time step delta-T.',
    motion:
      'Entrance: A paper sphere drops from the sky. Primary action: A vibrant coral arrow extends downward, stretching longer as gravity pulls. Secondary: Mascot jogs alongside it, using a tiny crayon to dot each trailing position. Exit: The falling arrow slams into an immovable teal bedrock platform.',
    voiceover:
      'Motion begins with a lone vector. Every frame, velocity nudges position forward. Add gravity, and the arrow grows. Simple, elegant, predictable… until objects collide.',
    soundCue:
      'Rhythmic pencil ticking like a pocket watch, increasing in pitch, ending with a sharp cardboard contact thud.',
    transitionObject:
      'The pointed tip of the velocity arrow embeds into the teal paper surface, splitting open into a contact interface.',
    caption:
      'Motion begins with a lone vector: position plus velocity times time.',
  },
  {
    id: 3,
    title: 'SCENE 3: DISRUPTION',
    subtitle: 'The Collision Catastrophe',
    startTime: 24,
    endTime: 36,
    learningPurpose:
      'Demonstrate why naive collision techniques fail: penalty springs explode into chaos, while Verlet distance sticks jitter and drift.',
    visual:
      'Split-screen comparison on textured gouache paper. On the left, a naive spring between blocks vibrates hysterically like an angry bee, launching blocks off screen. On the right, Verlet sticks wobble and deform unnaturally under stacking loads.',
    motion:
      'Entrance: Two boxes squeeze into each other. Primary: A crimson spring appears between them, coiling violently until it erupts, shooting a box toward the terminal ceiling. Secondary: Mascot shields its eyes and cowers in panic. Exit: Mascot catches a flying velocity arrow in mid-air and turns it horizontal.',
    voiceover:
      'When shapes overlap, naive engines push them apart with virtual springs. But springs store energy like angry bees—vibrating, exploding, and tearing structures apart.',
    soundCue:
      'Rapid chaotic twanging spring sound crescendoing into a popping balloon pop, followed by paper rustles and mascot squeak.',
    transitionObject:
      'The severed spring wire straightens into a crisp geometric contact normal axis.',
    caption:
      'Naive penalty springs store artificial energy, causing wild explosions.',
  },
  {
    id: 4,
    title: 'SCENE 4: MECHANISM',
    subtitle: 'The Secret of the Impulse',
    startTime: 36,
    endTime: 50,
    learningPurpose:
      'Explain the core breakthrough of modern physics engines: instantaneous velocity impulses resolved through projected Gauss-Seidel iterations.',
    visual:
      'A chalk-drawn contact manifold. Contact normal n in teal, tangent t in mustard, and lever arms rA, rB drawn in dry gouache. An animated balancing scale shows Newton’s equal and opposite impulse lambda.',
    motion:
      'Entrance: The camera zooms smoothly into the micro-gap between two touching boxes. Primary: A golden impulse pulse fires along the normal vector, instantly halting relative velocity without adding energy. Secondary: Mascot operates a small lever that clamps friction into the Coulomb cone. Exit: The single contact multiplies into dozens of stacked contacts.',
    voiceover:
      'The real breakthrough is the impulse: a clean instantaneous velocity kick. We do not wait for springs to stretch. We ask what force would bring relative velocity strictly to zero right now.',
    soundCue:
      'Crisp wooden mallet strike followed by a pure harmonic crystal chime and dry chalk scratching on slate.',
    transitionObject:
      'The single golden impulse arrow multiplies like a fractal tree into the base of a grand pyramid.',
    caption:
      'An impulse is an instant velocity kick that stops penetration without adding energy.',
  },
  {
    id: 5,
    title: 'SCENE 5: DISCOVERY',
    subtitle: 'Warm Starting & Accumulated Memory',
    startTime: 50,
    endTime: 64,
    learningPurpose:
      'Reveal the secret that enables 21-box pyramids to rest motionless: caching previous frame impulses so the solver starts 95% solved.',
    visual:
      'A 6-tier pyramid of 21 boxes assembled on a sturdy foundation. First shown without warm starting (boxes sink and chatter). Then warm starting toggles ON: golden ghost impulses from the last frame glow inside each contact, locking the entire pyramid into rock-solid stillness.',
    motion:
      'Entrance: 21 pastel paper boxes drop into a pyramid formation. Primary: Left side shows cold-start jitter; right side shows warm-started instant stability as ghost impulses illuminate. Secondary: Mascot confidently walks up the stepped pyramid like stairs. Exit: Mascot reaches the summit and points dramatically to an overhead crane.',
    voiceover:
      'Stacking twenty-one boxes should be impossible—impulses fight for supremacy. The secret? Memory. By remembering last frame’s push, the solver begins almost solved. Chaos becomes rock.',
    soundCue:
      'Shuffling card deck sound that locks into a deep, solid resonant bass thrum of stability, with cheerful mascot footsteps.',
    transitionObject:
      'The mascot’s pointing finger extends into a swinging steel chain suspended from a gantry crane.',
    caption:
      'Warm starting caches previous impulses: the solver starts 95% solved.',
  },
  {
    id: 6,
    title: 'SCENE 6: CONSEQUENCE',
    subtitle: 'The Grand Wrecking Ball',
    startTime: 64,
    endTime: 78,
    learningPurpose:
      'Demonstrate the coupled interaction of revolute joints, bilateral chain constraints, and violent momentum transfer during dynamic demolition.',
    visual:
      'The entire miniature stage pulls out to full 16:9 cinematic framing. A heavy glowing amber wrecking ball hangs from 5 revolute chain links. It pulls back, releases, and smashes straight through the 21-box pyramid in glorious stop-motion momentum transfer.',
    motion:
      'Entrance: Heavy steel ball pulls back on tensioned chain. Primary: Ball swings down in a magnificent arc, shattering the pyramid. Boxes tumble, rotate, and scatter, every contact point sparking with real-time normal and friction impulse vectors. Secondary: Mascot rides atop the swinging ball waving joyfully! Exit: Exploding boxes slow into weightless floating tiles.',
    voiceover:
      'Now, release the beast! Five links on revolute hinges transfer immense kinetic momentum. One violent smash, and every single contact resolves honestly. No tricks. Pure physics.',
    soundCue:
      'Heavy metallic chain rattle, a deep rising wind whoosh, followed by an exhilarating, satisfying multi-layered cardboard crash and wooden clatter.',
    transitionObject:
      'A spinning fragment of a pastel box tumbles forward to fill the center stage, becoming a drawing canvas.',
    caption:
      'Revolute joints transfer kinetic energy into hundreds of simultaneous contact impulses.',
  },
  {
    id: 7,
    title: 'SCENE 7: RECAP',
    subtitle: 'From Pure Math to Worlds',
    startTime: 78,
    endTime: 88,
    learningPurpose:
      'Summarize the journey from primitive vector math to complete simulated worlds, inviting the user to explore and smash the sandbox.',
    visual:
      'The paper world gently folds outward into a clean architectural blueprint diagram connecting all 6 layers: Vector -> Particle -> Rods -> Rigid Body -> Impulses -> Revolute Joints. The coral mascot stands in the center holding a glowing vector spark.',
    motion:
      'Entrance: Floating tiles assemble into a neat circular constellation around the mascot. Primary: Golden lines connect vectors to particles, then to rigid bodies, and finally to the pyramid. Secondary: Mascot bows playfully, then offers a glowing "Explore Physics Sandbox" portal. Exit: Fade to cozy warm terminal glow.',
    voiceover:
      'Vectors make particles. Particles become bodies. Impulses enforce reality. You didn’t just simulate physics—you built the world from the math up. Now, go swing the ball yourself.',
    soundCue:
      'Gentle, uplifting acoustic guitar chord progression layered with paper fold rustles and a warm sparkle bell decay.',
    transitionObject:
      'The glowing center spark blooms into the interactive Real-Time Physics Simulator.',
    caption:
      'From a single vector to an entire universe: you built physics from first principles.',
  },
];

export const SOUND_CUES: SoundEvent[] = [
  { time: 0.5, type: 'paper_slide' },
  { time: 4.0, type: 'cardboard_tap', pitch: 120 },
  { time: 8.5, type: 'whoosh' },
  { time: 13.0, type: 'crayon_scratch' },
  { time: 17.5, type: 'cardboard_tap', pitch: 200 },
  { time: 22.0, type: 'cardboard_tap', pitch: 140 },
  { time: 26.5, type: 'whoosh' },
  { time: 31.0, type: 'cardboard_tap', pitch: 300 },
  { time: 37.5, type: 'chime', pitch: 440 },
  { time: 43.0, type: 'crayon_scratch' },
  { time: 48.0, type: 'chime', pitch: 554 },
  { time: 52.0, type: 'paper_slide' },
  { time: 57.5, type: 'cardboard_tap', pitch: 180 },
  { time: 62.0, type: 'chime', pitch: 659 },
  { time: 65.0, type: 'whoosh' },
  { time: 68.5, type: 'smash' },
  { time: 73.0, type: 'cardboard_tap', pitch: 220 },
  { time: 79.0, type: 'chime', pitch: 587 },
  { time: 83.5, type: 'paper_slide' },
  { time: 86.0, type: 'chime', pitch: 880 },
];
