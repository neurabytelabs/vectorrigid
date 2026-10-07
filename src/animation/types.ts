export interface AnimationScene {
  id: number;
  title: string;
  subtitle: string;
  startTime: number; // seconds
  endTime: number; // seconds
  learningPurpose: string;
  visual: string;
  motion: string;
  voiceover: string;
  soundCue: string;
  transitionObject: string;
  caption: string;
}

export interface MascotState {
  x: number;
  y: number;
  scale: number;
  mood: 'curious' | 'excited' | 'puzzled' | 'proud' | 'waving';
  blinkTimer: number;
  armAngle: number;
  jumpOffset: number;
}

export interface SoundEvent {
  time: number;
  type: 'cardboard_tap' | 'paper_slide' | 'whoosh' | 'chime' | 'crayon_scratch' | 'smash';
  pitch?: number;
}
