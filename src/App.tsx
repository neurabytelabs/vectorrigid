import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vec2 } from './physics/math/Vec2';
import { PhysicsWorld, WorldStats } from './physics/PhysicsWorld';
import { SceneId, SCENE_PRESETS } from './physics/scenes/ScenePresets';
import { Body } from './physics/layer3_rigidbody/Body';
import { InspectedContactData } from './physics/inspector/ContactTelemetry';
import { PhysicsCanvas } from './components/PhysicsCanvas';
import { ControlHeader } from './components/ControlHeader';
import { ContactInspectorPanel } from './components/ContactInspectorPanel';
import { LayerInfoModal } from './components/LayerInfoModal';
import { MotionPlayer } from './components/motion/MotionPlayer';
import { ProductionBibleModal } from './components/motion/ProductionBibleModal';

export default function App() {
  // Primary App Mode: Motion Animation (narrated explainer) vs Live Physics Sandbox
  const [appMode, setAppMode] = useState<'motion_animation' | 'physics_sandbox'>('motion_animation');
  const [isBibleModalOpen, setIsBibleModalOpen] = useState<boolean>(false);

  // World instance
  const worldRef = useRef<PhysicsWorld>(new PhysicsWorld());
  const world = worldRef.current;

  // Scene state
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>('pyramid_wrecking_ball');
  const [wreckingBall, setWreckingBall] = useState<Body | null>(null);
  const [focalPoint, setFocalPoint] = useState<Vec2>(new Vec2(650, 420));
  const [defaultZoom, setDefaultZoom] = useState<number>(1.0);

  // Playback state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [stats, setStats] = useState<WorldStats>(world.stats);

  // Solver parameters
  const [warmStarting, setWarmStarting] = useState<boolean>(true);
  const [solverIterations, setSolverIterations] = useState<number>(18);

  // Visual toggles
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showNormals, setShowNormals] = useState<boolean>(true);
  const [showImpulses, setShowImpulses] = useState<boolean>(true);
  const [showLeverArms, setShowLeverArms] = useState<boolean>(true);
  const [showVelocities, setShowVelocities] = useState<boolean>(true);
  const [showAABBs, setShowAABBs] = useState<boolean>(false);

  // Deep contact inspection
  const [selectedContact, setSelectedContact] = useState<InspectedContactData | null>(null);

  // Architecture modal
  const [isLayerModalOpen, setIsLayerModalOpen] = useState<boolean>(false);

  // Load a scene preset
  const loadScene = useCallback(
    (sceneId: SceneId) => {
      setCurrentSceneId(sceneId);
      setSelectedContact(null);

      const preset = SCENE_PRESETS.find((s) => s.id === sceneId);
      if (preset) {
        const result = preset.setup(world);
        setWreckingBall(result.wreckingBall || null);
        if (result.focalPoint) setFocalPoint(result.focalPoint);
        if (result.defaultZoom) setDefaultZoom(result.defaultZoom);
      }
    },
    [world]
  );

  // Initial load
  useEffect(() => {
    loadScene('pyramid_wrecking_ball');
  }, [loadScene]);

  // Sync solver params with world instance
  useEffect(() => {
    world.solver.warmStartingEnabled = warmStarting;
    world.solver.velocityIterations = solverIterations;
  }, [world, warmStarting, solverIterations]);

  // Periodic stats poll
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...world.stats });
    }, 150);
    return () => clearInterval(interval);
  }, [world]);

  // Playback handlers
  const handleTogglePlay = () => setIsRunning((prev) => !prev);

  const handleStepFrame = () => {
    setIsRunning(false);
    world.step(1 / 60);
    setStats({ ...world.stats });
  };

  const handleResetScene = () => {
    loadScene(currentSceneId);
  };

  // Give wrecking ball an exhilarating smash impulse towards the pyramid!
  const handleSwingWreckingBall = () => {
    if (wreckingBall) {
      // Powerful swing to the right
      wreckingBall.velocity.set(650, -120);
      setIsRunning(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Header & Toolbar */}
      <ControlHeader
        activeMode={appMode}
        onChangeMode={setAppMode}
        onOpenBible={() => setIsBibleModalOpen(true)}
        currentScene={currentSceneId}
        onSelectScene={loadScene}
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        onStepFrame={handleStepFrame}
        onResetScene={handleResetScene}
        onSwingWreckingBall={handleSwingWreckingBall}
        stats={stats}
        warmStarting={warmStarting}
        onToggleWarmStarting={() => setWarmStarting((prev) => !prev)}
        solverIterations={solverIterations}
        onChangeIterations={setSolverIterations}
        showVectors={showVectors}
        onToggleVectors={() => setShowVectors((prev) => !prev)}
        showNormals={showNormals}
        onToggleNormals={() => setShowNormals((prev) => !prev)}
        showImpulses={showImpulses}
        onToggleImpulses={() => setShowImpulses((prev) => !prev)}
        showLeverArms={showLeverArms}
        onToggleLeverArms={() => setShowLeverArms((prev) => !prev)}
        onOpenLayerGuide={() => setIsLayerModalOpen(true)}
      />

      {/* Main Viewport: Either Motion Animation Theater or Live Physics Sandbox */}
      {appMode === 'motion_animation' ? (
        <main className="flex-1 overflow-hidden relative">
          <MotionPlayer
            onOpenBible={() => setIsBibleModalOpen(true)}
            onJumpToSandbox={() => setAppMode('physics_sandbox')}
          />
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden relative">
          {/* Canvas viewport */}
          <div className="flex-1 h-full relative">
            <PhysicsCanvas
              world={world}
              wreckingBall={wreckingBall}
              isRunning={isRunning}
              onStepTick={() => setStats({ ...world.stats })}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
              showVectors={showVectors}
              showNormals={showNormals}
              showImpulses={showImpulses}
              showLeverArms={showLeverArms}
              showVelocities={showVelocities}
              showAABBs={showAABBs}
              onResetZoom={() => setSelectedContact(null)}
              focalPoint={focalPoint}
              defaultZoom={defaultZoom}
            />

            {/* Quick Scene Banner */}
            <div className="absolute top-3 left-4 pointer-events-none flex flex-col gap-1">
              <span className="text-xs font-mono font-semibold text-cyan-400">
                {SCENE_PRESETS.find((s) => s.id === currentSceneId)?.layerTitle}
              </span>
              <span className="text-xs text-slate-400 max-w-lg leading-relaxed">
                {SCENE_PRESETS.find((s) => s.id === currentSceneId)?.description}
              </span>
            </div>

            {/* Legend Overlay at bottom-right of canvas */}
            <div className="absolute bottom-4 right-4 pointer-events-none bg-slate-900/80 backdrop-blur border border-slate-800/80 px-3 py-2 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-cyan-400" />
                <span>n̂ Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-400" />
                <span>t̂ Friction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-400" />
                <span>P⃗ Impulse</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-purple-400 border-b border-dashed border-purple-400" />
                <span>r⃗ Lever Arm</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Iteration & Vector Telemetry Inspector */}
          <ContactInspectorPanel
            contactData={selectedContact}
            onClose={() => setSelectedContact(null)}
            onResetZoom={() => setSelectedContact(null)}
            solverIterations={solverIterations}
            warmStartingEnabled={warmStarting}
            totalContacts={stats.contactCount}
          />
        </main>
      )}

      {/* Layer Architecture Proofs Modal */}
      <LayerInfoModal
        isOpen={isLayerModalOpen}
        onClose={() => setIsLayerModalOpen(false)}
      />

      {/* Production Bible & Storyboard Modal */}
      <ProductionBibleModal
        isOpen={isBibleModalOpen}
        onClose={() => setIsBibleModalOpen(false)}
      />
    </div>
  );
}
