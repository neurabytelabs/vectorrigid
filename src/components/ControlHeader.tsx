import React from 'react';
import { Play, Pause, StepForward, RotateCcw, Flame, Eye, BookOpen, Layers, Film } from 'lucide-react';
import { SceneId, SCENE_PRESETS } from '../physics/scenes/ScenePresets';
import { WorldStats } from '../physics/PhysicsWorld';

interface ControlHeaderProps {
  activeMode: 'motion_animation' | 'physics_sandbox';
  onChangeMode: (mode: 'motion_animation' | 'physics_sandbox') => void;
  onOpenBible: () => void;
  currentScene: SceneId;
  onSelectScene: (id: SceneId) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepFrame: () => void;
  onResetScene: () => void;
  onSwingWreckingBall: () => void;
  stats: WorldStats;
  warmStarting: boolean;
  onToggleWarmStarting: () => void;
  solverIterations: number;
  onChangeIterations: (val: number) => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  showNormals: boolean;
  onToggleNormals: () => void;
  showImpulses: boolean;
  onToggleImpulses: () => void;
  showLeverArms: boolean;
  onToggleLeverArms: () => void;
  onOpenLayerGuide: () => void;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  activeMode,
  onChangeMode,
  onOpenBible,
  currentScene,
  onSelectScene,
  isRunning,
  onTogglePlay,
  onStepFrame,
  onResetScene,
  onSwingWreckingBall,
  stats,
  warmStarting,
  onToggleWarmStarting,
  solverIterations,
  onChangeIterations,
  showVectors,
  onToggleVectors,
  showNormals,
  onToggleNormals,
  showImpulses,
  onToggleImpulses,
  showLeverArms,
  onToggleLeverArms,
  onOpenLayerGuide,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 text-slate-200 select-none z-20">
      {/* Top brand line & metadata */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F26A5A]" />
            <h1 className="font-bold text-sm tracking-wide text-slate-100 font-mono">
              VectorRigid
            </h1>
          </div>
          <span className="text-slate-600" aria-hidden="true">|</span>

          {/* Primary Mode Switcher (Educational Motion Story vs Physics Sandbox) */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => onChangeMode('motion_animation')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-md transition ${
                activeMode === 'motion_animation'
                  ? 'bg-[#F26A5A] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Motion Design Story (88s)</span>
            </button>
            <button
              onClick={() => onChangeMode('physics_sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-md transition ${
                activeMode === 'physics_sandbox'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Physics Engine Sandbox</span>
            </button>
          </div>
        </div>

        {/* Global telemetry readout & Guides */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {activeMode === 'physics_sandbox' && (
            <div className="hidden lg:flex items-center gap-2 text-slate-400">
              <span>Bodies: <strong className="text-slate-200 font-semibold">{stats.bodyCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Contacts: <strong className="text-cyan-400 font-semibold">{stats.contactCount}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Solver Time: <strong className="text-slate-200">{stats.stepTimeMs.toFixed(2)}ms</strong></span>
            </div>
          )}

          <button
            onClick={onOpenBible}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-700/60 rounded-md transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Production Bible</span>
          </button>

          <button
            onClick={onOpenLayerGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-md transition"
          >
            <span>Proofs & Equations</span>
          </button>
        </div>
      </div>

      {/* Main control toolbar & scene tabs */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Scene Selection Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80">
          {SCENE_PRESETS.map((preset) => {
            const isActive = currentScene === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectScene(preset.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Playback & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Smash Wrecking Ball Button */}
          {currentScene === 'pyramid_wrecking_ball' && (
            <button
              onClick={onSwingWreckingBall}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md shadow-sm transition active:scale-95 cursor-pointer"
              title="Give wrecking ball a powerful swing towards the pyramid!"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Swing Wrecking Ball</span>
            </button>
          )}

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition ${
              isRunning
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-emerald-600/90 border-emerald-500 text-white hover:bg-emerald-500'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Play'}</span>
          </button>

          {/* Step Frame */}
          <button
            onClick={onStepFrame}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition"
            title="Step simulation forward by 1 tick (16.6ms)"
          >
            <StepForward className="w-3.5 h-3.5 text-slate-400" />
            <span>Step</span>
          </button>

          {/* Reset Scene */}
          <button
            onClick={onResetScene}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition"
            title="Reset scene to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Solver Toggles & Visual Overlays */}
        <div className="flex items-center gap-3 text-xs">
          {/* Warm Starting Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">Warm Start:</span>
            <button
              onClick={onToggleWarmStarting}
              className={`px-2 py-1 text-[11px] font-mono rounded border transition ${
                warmStarting
                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 font-semibold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
              title="Warm starting caches impulses across frames to stabilize stacks"
            >
              {warmStarting ? 'ON (Stable)' : 'OFF (Cold)'}
            </button>
          </div>

          {/* Iterations selector */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-400">Iter:</span>
            <select
              value={solverIterations}
              onChange={(e) => onChangeIterations(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-cyan-400"
            >
              <option value={5}>5 (Fast)</option>
              <option value={10}>10</option>
              <option value={15}>15 (Standard)</option>
              <option value={20}>20 (Rock Solid)</option>
              <option value={30}>30</option>
            </select>
          </div>

          {/* Vector Overlays */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/80 p-0.5 rounded-md">
            <button
              onClick={onToggleVectors}
              className={`px-2 py-1 text-[11px] rounded transition ${
                showVectors ? 'bg-cyan-900/50 text-cyan-300 font-medium' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle all vector overlays"
            >
              Vectors
            </button>
            <button
              onClick={onToggleNormals}
              className={`px-1.5 py-1 text-[10px] font-mono rounded transition ${
                showNormals ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Toggle normal vectors n"
            >
              n̂
            </button>
            <button
              onClick={onToggleImpulses}
              className={`px-1.5 py-1 text-[10px] font-mono rounded transition ${
                showImpulses ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Toggle impulse vectors P"
            >
              P⃗
            </button>
            <button
              onClick={onToggleLeverArms}
              className={`px-1.5 py-1 text-[10px] font-mono rounded transition ${
                showLeverArms ? 'bg-slate-800 text-purple-400' : 'text-slate-500 hover:text-slate-400'
              }`}
              title="Toggle lever arms rA & rB"
            >
              r⃗
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
