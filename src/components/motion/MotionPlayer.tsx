import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, BookOpen, ExternalLink, FastForward } from 'lucide-react';
import { SCENES, TOTAL_DURATION, SOUND_CUES } from '../../animation/storyboardData';
import { SoundSynthesizer } from '../../animation/audio/SoundSynthesizer';
import { SpeechNarrator } from '../../animation/audio/SpeechNarrator';
import { MotionStageCanvas } from './MotionStageCanvas';

interface MotionPlayerProps {
  onOpenBible: () => void;
  onJumpToSandbox: () => void;
}

export const MotionPlayer: React.FC<MotionPlayerProps> = ({
  onOpenBible,
  onJumpToSandbox,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [stopMotionBoil, setStopMotionBoil] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState<boolean>(true);

  const soundSynthRef = useRef<SoundSynthesizer | null>(null);
  const narratorRef = useRef<SpeechNarrator | null>(null);
  const lastSoundIndexRef = useRef<number>(-1);
  const lastSpokenSceneRef = useRef<number>(-1);

  // Initialize Audio & Speech
  useEffect(() => {
    soundSynthRef.current = new SoundSynthesizer();
    narratorRef.current = new SpeechNarrator();

    return () => {
      soundSynthRef.current?.destroy();
      narratorRef.current?.stop();
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    soundSynthRef.current?.setMuted(!soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    narratorRef.current?.setEnabled(voiceoverEnabled);
  }, [voiceoverEnabled]);

  // Main playback loop
  useEffect(() => {
    let animId: number;
    let lastStamp = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastStamp) / 1000;
      lastStamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaSec * playbackSpeed;
          if (next >= TOTAL_DURATION) {
            setIsPlaying(false);
            return TOTAL_DURATION;
          }

          // Trigger sound cues
          if (soundEnabled && soundSynthRef.current) {
            SOUND_CUES.forEach((cue, idx) => {
              if (prev < cue.time && next >= cue.time && idx > lastSoundIndexRef.current) {
                lastSoundIndexRef.current = idx;
                switch (cue.type) {
                  case 'cardboard_tap':
                    soundSynthRef.current?.playCardboardTap(cue.pitch);
                    break;
                  case 'paper_slide':
                    soundSynthRef.current?.playPaperSlide();
                    break;
                  case 'crayon_scratch':
                    soundSynthRef.current?.playCrayonScratch();
                    break;
                  case 'chime':
                    soundSynthRef.current?.playChime(cue.pitch);
                    break;
                  case 'whoosh':
                    soundSynthRef.current?.playWhoosh();
                    break;
                  case 'smash':
                    soundSynthRef.current?.playSmash();
                    break;
                }
              }
            });
          }

          // Trigger Voiceover per scene entrance
          const activeSceneIdx = SCENES.findIndex(
            (s) => next >= s.startTime && next < s.endTime
          );
          if (
            voiceoverEnabled &&
            narratorRef.current &&
            activeSceneIdx !== -1 &&
            activeSceneIdx !== lastSpokenSceneRef.current
          ) {
            lastSpokenSceneRef.current = activeSceneIdx;
            narratorRef.current.speak(SCENES[activeSceneIdx].voiceover);
          }

          return next;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, soundEnabled, voiceoverEnabled]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (currentTime >= TOTAL_DURATION) {
      setCurrentTime(0);
      lastSoundIndexRef.current = -1;
      lastSpokenSceneRef.current = -1;
    }
    setIsPlaying((p) => {
      const next = !p;
      if (next) {
        soundSynthRef.current?.startAmbience();
      } else {
        soundSynthRef.current?.stopAmbience();
        narratorRef.current?.stop();
      }
      return next;
    });
  };

  const handleReset = () => {
    setCurrentTime(0);
    lastSoundIndexRef.current = -1;
    lastSpokenSceneRef.current = -1;
    narratorRef.current?.stop();
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    lastSoundIndexRef.current = SOUND_CUES.findIndex((c) => c.time > newTime) - 1;
    narratorRef.current?.stop();
    const activeIdx = SCENES.findIndex((s) => newTime >= s.startTime && newTime < s.endTime);
    lastSpokenSceneRef.current = activeIdx;
    if (voiceoverEnabled && activeIdx !== -1 && narratorRef.current) {
      narratorRef.current.speak(SCENES[activeIdx].voiceover);
    }
  };

  // Current Scene details
  const activeSceneIndex = SCENES.findIndex(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );
  const currentScene = SCENES[activeSceneIndex] || SCENES[SCENES.length - 1];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#141618] text-slate-200 select-none overflow-hidden font-sans">
      {/* Top Banner Toolbar */}
      <div className="h-12 bg-[#1b1f23] border-b border-slate-800/80 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F26A5A]" />
            <span className="font-semibold text-slate-100 font-mono tracking-wide">
              VECTORRIGID MOTION STORY
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {currentScene.title}: <strong className="text-slate-200">{currentScene.subtitle}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStopMotionBoil((b) => !b)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 border transition ${
              stopMotionBoil
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle procedural 1-2px stop-motion paper boil wobble"
          >
            <Sparkles className="w-3 h-3" />
            <span>Boil Wobble: {stopMotionBoil ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onOpenBible}
            className="px-3 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Production Bible & Storyboard</span>
          </button>

          <button
            onClick={onJumpToSandbox}
            className="px-3 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 bg-[#F26A5A] hover:bg-[#d9534f] text-white font-semibold transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Play in Physics Sandbox</span>
          </button>
        </div>
      </div>

      {/* Main 16:9 Canvas Stage Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
        <div className="w-full h-full max-w-[1400px] aspect-[16/9] shadow-2xl rounded-lg overflow-hidden border border-slate-800/90 relative">
          <MotionStageCanvas
            currentTime={currentTime}
            stopMotionBoilEnabled={stopMotionBoil}
            onSelectScene={(idx) => handleSeek(SCENES[idx]?.startTime ?? 0)}
          />

          {/* Subtitles / Narration Caption Bar */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 max-w-2xl w-[90%] px-4 py-2.5 rounded-lg bg-[#23272A]/90 backdrop-blur border border-slate-700/80 shadow-lg text-center">
            <p className="text-sm font-medium text-amber-100/95 font-sans leading-relaxed tracking-wide drop-shadow-sm">
              "{currentScene.caption}"
            </p>
          </div>
        </div>
      </div>

      {/* Scrubber Timeline & Media Controls */}
      <div className="h-28 bg-[#181b1e] border-t border-slate-800/80 px-6 py-2 flex flex-col justify-between">
        {/* Scene Chapter Markers */}
        <div className="flex items-center gap-1 w-full pt-1">
          {SCENES.map((scene, i) => {
            const isCurrent = activeSceneIndex === i;
            return (
              <button
                key={scene.id}
                onClick={() => handleSeek(scene.startTime)}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-mono text-center truncate transition border ${
                  isCurrent
                    ? 'bg-[#2E8B85]/30 border-[#2E8B85] text-cyan-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`${scene.title}: ${scene.subtitle}`}
              >
                {scene.id}. {scene.subtitle}
              </button>
            );
          })}
        </div>

        {/* Scrubber Track */}
        <div className="flex items-center gap-3 w-full py-1">
          <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-3 bg-slate-900 rounded-full relative cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              handleSeek(ratio * TOTAL_DURATION);
            }}
          >
            {/* Filled Progress */}
            <div
              className="h-full bg-gradient-to-r from-[#2E8B85] via-[#EBB036] to-[#F26A5A] rounded-full transition-all"
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
            {/* Playhead Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-[#F26A5A] group-hover:scale-125 transition-transform"
              style={{ left: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500 w-10">
            {formatTime(TOTAL_DURATION)}
          </span>
        </div>

        {/* Playback Controls & Toggles */}
        <div className="flex items-center justify-between pb-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium flex items-center gap-2 border border-slate-700 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Story'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Restart animation from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 ml-2">
              <FastForward className="w-3 h-3 text-slate-500" />
              {[0.5, 1.0, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                    playbackSpeed === s
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-xs font-mono">
            {/* Audio SFX Toggle */}
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className={`flex items-center gap-1.5 hover:text-slate-200 transition ${
                soundEnabled ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>Tactile SFX: {soundEnabled ? 'ON' : 'Muted'}</span>
            </button>

            {/* Voiceover Speech Toggle */}
            <button
              onClick={() => setVoiceoverEnabled((v) => !v)}
              className={`flex items-center gap-1.5 hover:text-slate-200 transition ${
                voiceoverEnabled ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <span>Voiceover: {voiceoverEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-500">24 FPS Animation Master</span>
          </div>
        </div>
      </div>
    </div>
  );
};
