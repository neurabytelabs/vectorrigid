import React, { useState } from 'react';
import { X, Palette, User, Film, Mic, GitBranch, Volume2, Code2 } from 'lucide-react';
import { SCENES, TOTAL_DURATION } from '../../animation/storyboardData';

interface ProductionBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | 'concept'
  | 'visual_system'
  | 'character'
  | 'storyboard'
  | 'voiceover'
  | 'transitions'
  | 'sound_plan'
  | 'technical';

export const ProductionBibleModal: React.FC<ProductionBibleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('concept');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181b1e] border border-slate-700/80 rounded-xl w-full max-w-5xl h-[88vh] flex flex-col text-slate-200 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-[#141618] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm bg-[#F26A5A]" />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Production Bible: 88-Second Explainer
              </h2>
              <p className="text-xs text-slate-400">
                88-Second Stop-Motion Educational Master • 1920x1080 • 24 FPS • 7 Seamless Scenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#1b1f23] border-b border-slate-800 px-4 py-2 text-xs overflow-x-auto">
          {[
            { id: 'concept', label: '1. Concept & Purpose', icon: Film },
            { id: 'visual_system', label: '2. Visual System', icon: Palette },
            { id: 'character', label: '3. Character Sheet', icon: User },
            { id: 'storyboard', label: '4. Timestamped Storyboard', icon: Film },
            { id: 'voiceover', label: '5. Final Voiceover (135 WPM)', icon: Mic },
            { id: 'transitions', label: '6. Transition Map', icon: GitBranch },
            { id: 'sound_plan', label: '7. Tactile Sound Plan', icon: Volume2 },
            { id: 'technical', label: '8. Technical Architecture', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#F26A5A] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* TAB 1: CONCEPT */}
          {activeTab === 'concept' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 p-5 rounded-lg border border-slate-800 space-y-3">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;purpose&gt;
                </span>
                <h3 className="text-xl font-bold text-slate-100">
                  Topic: How Video Game Physics Truly Works from Scratch
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Core Idea:</strong> Game physics engines do not "fake" solidity with rigid sticks or penalty springs. They resolve non-penetration velocity constraints through projected Gauss-Seidel sequential impulses with warm-starting, turning potential interpenetration into kinetic momentum conservation.
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  <strong>Audience:</strong> Curious engineers, computer science students, and game developers who want to understand how thousands of interacting particles and boxes become stable virtual worlds from first principles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                  <h4 className="font-semibold text-amber-300 font-mono text-xs mb-1">
                    Central Cause-and-Effect
                  </h4>
                  <p className="text-xs text-slate-400">
                    Velocity steps cause penetration $\to$ Penetration triggers contact normal impulse $\lambda$ $\to$ Impulse kicks relative velocity to zero $\to$ Warm starting caches $\lambda$ for next frame rock-like stability.
                  </p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                  <h4 className="font-semibold text-cyan-300 font-mono text-xs mb-1">
                    Total Runtime
                  </h4>
                  <p className="text-xs text-slate-400">
                    <strong>{TOTAL_DURATION} seconds</strong> (within 75-90s specification), split into 7 meaningful, continuous narrative acts without hard cuts.
                  </p>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                  <h4 className="font-semibold text-emerald-300 font-mono text-xs mb-1">
                    Narrative Voice
                  </h4>
                  <p className="text-xs text-slate-400">
                    Playful yet rigorous, treating the viewer like a peer engineer proving they could have invented game physics themselves.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL SYSTEM */}
          {activeTab === 'visual_system' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;visual_identity&gt;
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  Handcrafted Miniature Stage & Color Palette
                </h3>
                <p className="text-xs text-slate-400">
                  Built from torn paper cutouts, dry gouache textures, crayon lines, and soft cardboard drop shadows framed within a dark terminal window.
                </p>
              </div>

              {/* Color Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { name: 'Coral', hex: '#F26A5A', role: 'Mascot, Velocity Vectors, Action Accents' },
                  { name: 'Mustard', hex: '#EBB036', role: 'Cardboard Boxes, Masking Tape, Tangents' },
                  { name: 'Teal', hex: '#2E8B85', role: 'Bedrock Foundation, Normals, Grids' },
                  { name: 'Cream', hex: '#F7F4EB', role: 'Paper Stage, Cards, Falling Particles' },
                  { name: 'Charcoal', hex: '#23272A', role: 'Terminal Matte, Cardboard Shadows, Eyes' },
                ].map((c) => (
                  <div key={c.name} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="h-16 rounded-md shadow-inner border border-black/20" style={{ backgroundColor: c.hex }} />
                    <div className="font-mono text-xs font-bold text-slate-100">{c.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{c.hex}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{c.role}</div>
                  </div>
                ))}
              </div>

              {/* Texture Rules */}
              <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-200 text-xs font-mono uppercase tracking-wide">
                  Stop-Motion Boil Specification
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li><strong>Boil Rate:</strong> Jitter updates every 3 frames (~8 fps stop-motion boil rate).</li>
                  <li><strong>Amplitude:</strong> Vector vertices and shape edges perturb by randomized $\pm 1.4$ px.</li>
                  <li><strong>Shadows:</strong> Soft cardboard drop shadows offset 8-10px down-right with 18% opacity charcoal.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: CHARACTER SHEET */}
          {activeTab === 'character' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;character_sheet&gt;
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  The Coral Pixel Mascot: Guide & Scientific Narrator
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 p-6 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-24 h-24 bg-[#F26A5A] rounded-sm relative flex items-center justify-center shadow-lg border border-red-400/40">
                    <div className="absolute top-8 left-5 w-3 h-4 bg-[#23272A] rounded-sm" />
                    <div className="absolute top-8 right-5 w-3 h-4 bg-[#23272A] rounded-sm" />
                    <div className="absolute bottom-5 w-4 h-1.5 bg-[#23272A] rounded-sm" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 font-mono">Pixel Mascot</h4>
                    <p className="text-xs text-slate-400">The Curious Physics Explorer</p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-xs font-mono text-amber-300">Anatomy & Proportions</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Exact 48x48 pixel square silhouette. Pure Coral (#F26A5A) gouache fill with soft paper highlight edge. Two vertical charcoal pixel pill eyes and animated 1-pixel mouth. Consistent scale across all 7 scenes.
                    </p>
                  </div>

                  <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-xs font-mono text-cyan-300">Emotional Expressions & Gestures</h4>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      <li><strong>Curious:</strong> One eyebrow tilted, inquisitive squint, walks along vectors with crayon.</li>
                      <li><strong>Shocked:</strong> Wide circular eyes, mouth open, cowers as penalty spring explodes.</li>
                      <li><strong>Proud:</strong> Stretches tall, operates the impulse lever, stands firmly on warm-started stack.</li>
                      <li><strong>Adventurous:</strong> Rides on top of the swinging wrecking ball, waving joyfully to the camera!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORYBOARD */}
          {activeTab === 'storyboard' && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                &lt;storyboard&gt;
              </span>
              <div className="space-y-4">
                {SCENES.map((scene) => (
                  <div key={scene.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-amber-400 font-mono text-sm">
                        {scene.title} [{scene.startTime}s - {scene.endTime}s]
                      </span>
                      <span className="text-xs font-mono text-cyan-400 font-semibold">
                        {scene.subtitle}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <strong className="text-slate-300 font-mono">Learning Purpose:</strong>
                        <p className="text-slate-400 mt-0.5">{scene.learningPurpose}</p>
                      </div>
                      <div>
                        <strong className="text-slate-300 font-mono">Physical Morphing Transition:</strong>
                        <p className="text-emerald-300 mt-0.5">{scene.transitionObject}</p>
                      </div>
                      <div>
                        <strong className="text-slate-300 font-mono">Visual Choreography:</strong>
                        <p className="text-slate-400 mt-0.5">{scene.visual}</p>
                      </div>
                      <div>
                        <strong className="text-slate-300 font-mono">Motion Sequence:</strong>
                        <p className="text-slate-400 mt-0.5">{scene.motion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: VOICEOVER */}
          {activeTab === 'voiceover' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;voiceover_script&gt;
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  Final Spoken Narration Script (Target Cadence: 130 WPM)
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {SCENES.map((scene) => (
                  <div key={scene.id} className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-amber-400 font-semibold text-[11px]">
                      {scene.title} ({scene.startTime}s - {scene.endTime}s)
                    </div>
                    <p className="text-slate-200 text-sm font-sans italic leading-relaxed">
                      "{scene.voiceover}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TRANSITION MAP */}
          {activeTab === 'transitions' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;transition_map&gt;
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  Zero Hard Cuts: Organic Physical Morphing Chain
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { from: 'Scene 1: Hook', to: 'Scene 2: Familiar World', morph: 'The overlapping ghost intersection between the two blocks sharpens into a pencil sketch of a single falling particle.' },
                  { from: 'Scene 2: Familiar World', to: 'Scene 3: Disruption', morph: 'The pointed tip of the velocity arrow embeds into the teal paper surface, splitting open into a violent coiled spring.' },
                  { from: 'Scene 3: Disruption', to: 'Scene 4: Mechanism', morph: 'The severed spring wire straightens into a crisp geometric contact normal axis.' },
                  { from: 'Scene 4: Mechanism', to: 'Scene 5: Discovery', morph: 'The single golden impulse arrow multiplies like a fractal tree into the base of a 21-box pyramid.' },
                  { from: 'Scene 5: Discovery', to: 'Scene 6: Consequence', morph: 'The mascot’s pointing finger extends into a swinging steel chain suspended from a crane gantry.' },
                  { from: 'Scene 6: Consequence', to: 'Scene 7: Recap', morph: 'A spinning cardboard brick fragment from the shattered pyramid tumbles forward to become the central stage diagram.' },
                ].map((t, idx) => (
                  <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex items-start gap-4">
                    <span className="font-mono text-cyan-400 font-bold text-sm">Step {idx + 1}</span>
                    <div className="space-y-1">
                      <div className="font-mono text-[11px] text-amber-300">
                        {t.from} <span className="text-slate-500">⟶</span> {t.to}
                      </div>
                      <p className="text-slate-300 leading-relaxed">{t.morph}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SOUND PLAN */}
          {activeTab === 'sound_plan' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;sound_plan&gt;
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  Tactile Procedural Audio Architecture (Web Audio API)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-300 font-mono">1. Cardboard Tap</h4>
                  <p className="text-slate-400">
                    Dual-stage sound: 800Hz low-pass filtered white noise burst for tactile surface click, blended with an exponential decaying 140Hz triangle oscillator for resonant hollow box mass.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-300 font-mono">2. Paper Slide & Rustle</h4>
                  <p className="text-slate-400">
                    Band-pass filtered noise sweeping from 1400Hz to 800Hz across 220ms, simulating torn construction paper sliding on a desk.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-300 font-mono">3. Crayon Scratch</h4>
                  <p className="text-slate-400">
                    High-pass filtered noise (2200Hz) with randomized micro-droplets, reproducing the textured grain of wax crayon on rough paper.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-300 font-mono">4. Harmonic Chime</h4>
                  <p className="text-slate-400">
                    Pure sine waves with a non-integer overtone (2.01x) decaying over 850ms, celebrating vector breakthroughs and mathematical balance.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-300 font-mono">5. Wrecking Ball Smash</h4>
                  <p className="text-slate-400">
                    Sub-bass 90Hz$\to$35Hz physical thump layered with high-energy noise crunch and wood crackle, delivering punchy destructive momentum.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-300 font-mono">6. Acoustic Ambience Bed</h4>
                  <p className="text-slate-400">
                    Three soft harmonic sine tones (C3, G3, E4) providing a warm, non-intrusive lo-fi background bed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TECHNICAL */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-[#F26A5A]">
                  &lt;technical_implementation&gt;
                </span>
                <h3 className="text-lg font-bold text-slate-100">
                  Engine Architecture & Real-Time Specifications
                </h3>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
                  <div>
                    <div className="text-slate-500">Virtual Resolution</div>
                    <div className="text-cyan-400 font-bold">1920 x 1080 (16:9)</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Animation Framerate</div>
                    <div className="text-cyan-400 font-bold">24 FPS (Synced Canvas)</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Stop-Motion Boil</div>
                    <div className="text-amber-400 font-bold">8 FPS Procedural Wobble</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Audio Pipeline</div>
                    <div className="text-emerald-400 font-bold">Pure Web Audio API</div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 text-slate-400 leading-relaxed font-sans text-xs">
                  <strong>Physics Hand-off:</strong> The animation is directly coupled to our underlying TypeScript physics engine. At any second, viewers can press "Play in Physics Sandbox" to transition from the choreographed motion story into the active, interactive physics engine with live vector inspection, dragging, and contact manifolds.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141618] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">VectorRigid motion story • storyboard, narration and sound plan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close Production Bible
          </button>
        </div>
      </div>
    </div>
  );
};
