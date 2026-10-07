import React, { useState } from 'react';
import { X, CheckCircle2, ChevronRight, Layers, Cpu, Shield, ArrowRight } from 'lucide-react';

interface LayerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LAYERS_DATA = [
  {
    layer: 0,
    title: 'Layer 0: Vector & Matrix Mathematics from Scratch',
    summary: 'Pure Vec2 and Mat2 linear algebra without external dependencies.',
    formula: 'a × b = ax·by - ay·bx,   M_eff = K^-1',
    description:
      'Everything in VectorRigid begins with primitive floats. We implemented a high-performance 2D vector class supporting dot products, 2D scalar cross products (representing the z-axis torque), normal perpendiculars (-y, x), and 2x2 matrix inversion for simultaneous coordinate solving.',
  },
  {
    layer: 1,
    title: 'Layer 1: Particle Integrators',
    summary: 'Explicit Euler vs Symplectic (Semi-Implicit) Euler vs Verlet.',
    formula: 'v_{t+dt} = v_t + (F/m)·dt,   x_{t+dt} = x_t + v_{t+dt}·dt',
    description:
      'Naive physics engines use Explicit (Forward) Euler which artificially injects energy into the system, causing orbits and springs to spiral out of control. We implemented Semi-Implicit Euler (Euler-Cromer), which updates velocity before position, preserving phase space volume (symplectic) and yielding bounded, energy-conserving orbits.',
  },
  {
    layer: 2,
    title: 'Layer 2: Rods, Cables & Distance Constraints',
    summary: 'Bilateral constraints vs unilateral slack cables.',
    formula: 'C(x1, x2) = ||x2 - x1|| - L = 0  (Rod)  vs  C <= 0  (Cable)',
    description:
      'Rigid rods resist both tension and compression, maintaining strict inter-particle separation. Unilateral cables resist only tension and go slack when compressed. We resolve these constraints using direct velocity impulses with Baumgarte error stabilization.',
  },
  {
    layer: 3,
    title: 'Layer 3: Rigid Body Dynamics & Moments of Inertia',
    summary: 'Linear and angular momentum coupling with moments of inertia.',
    formula: 'τ = r × F,   I_box = (1/12)·m·(w² + h²),   I_disc = (1/2)·m·r²',
    description:
      'Rigid bodies possess both center-of-mass translation and angular orientation. When a force is applied off-center at lever arm r, it generates torque tau = r x F. Angular velocity omega accelerates via alpha = tau / I. When impulses are applied at contact points, linear and angular velocities change simultaneously: delta_v = J/m, delta_omega = (r x J) / I.',
  },
  {
    layer: 4,
    title: 'Layer 4: Separating Axis Theorem (SAT) & Manifold Clipping',
    summary: 'Separating Axis Theorem + Sutherland-Hodgman Polygon Clipping.',
    formula: 'min_axis (overlap),   incident_edge.clip(reference_planes)',
    description:
      'Unlike naive point-distance approximations, we test all 4 edge normals of oriented bounding boxes (OBBs). If an axis of separation is found, the boxes cannot collide. Otherwise, the axis of minimal penetration identifies the Reference Face. The opposite Incident Face is then clipped against the reference side planes and front plane, extracting 1 or 2 exact contact points with local anchors rA and rB.',
  },
  {
    layer: 5,
    title: 'Layer 5: Sequential Impulses with Warm Starting & Friction',
    summary: 'Projected Gauss-Seidel constraint solver with Coulomb friction cone.',
    formula: 'Kn = 1/mA + 1/mB + (rA×n)²/IA + (rB×n)²/IB,   Δλn = -m_eff·(vn + bias)',
    description:
      'The pinnacle of modern rigid-body physics. Contacts are formulated as velocity constraints. At each contact point, the effective mass Kn is computed. In each solver iteration, normal and friction impulses are computed sequentially and clamped to the Coulomb friction cone (|lambda_t| <= mu * lambda_n). Warm starting caches accumulated impulses across frames by contact feature ID, providing the rock-solid stability required to stack pyramids without jitter or sinking.',
  },
  {
    layer: 6,
    title: 'Layer 6: Revolute Joints (Pins & Hinges)',
    summary: '2x2 block effective mass solver for bilateral hinges and chains.',
    formula: 'C = (pB + rB) - (pA + rA) = 0,   M·Δλ = -C_dot',
    description:
      'Revolute joints pin two bodies together at specific local anchor points. We compute the full 2x2 symmetric constraint matrix K accounting for linear mass and rotational inertia of both bodies. Solved simultaneously with warm starting, creating rigid links that support the heavy wrecking ball chain.',
  },
  {
    layer: 7,
    title: 'Layer 7: The Pyramid & Wrecking Ball Proof',
    summary: 'Verifiable physical equilibrium: sum(Fn) = sum(m_box · g).',
    formula: 'Σ λn / Δt = 21 · m_box · g  (Static Equilibrium)',
    description:
      'In a 6-tier pyramid of 21 boxes, the bedrock ground contacts must support all 21 boxes (84 kg under 800 px/s² = 67,200 N). Our sequential impulse solver distributes this weight progressively across tiers. You can zoom into any contact point to see the normal impulse lambda_n converge over iterations to the exact equilibrium value.',
  },
];

export const LayerInfoModal: React.FC<LayerInfoModalProps> = ({ isOpen, onClose }) => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);

  if (!isOpen) return null;

  const current = LAYERS_DATA[selectedLayerIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-mono">
                First-Principles Physics Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Designed layer-by-layer from vector math to sequential impulses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Layer List Sidebar */}
          <div className="w-72 border-r border-slate-800 bg-slate-950/40 p-3 space-y-1 overflow-y-auto">
            {LAYERS_DATA.map((item, idx) => {
              const isActive = selectedLayerIndex === idx;
              return (
                <button
                  key={item.layer}
                  onClick={() => setSelectedLayerIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-200 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-mono text-cyan-400/90 font-semibold mr-1.5">L{item.layer}</span>
                    <span>{item.title.split(':')[1]?.trim() || item.title}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Layer Details */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
                Architecture Specification
              </div>
              <h3 className="text-lg font-bold text-slate-100">{current.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{current.summary}</p>
            </div>

            {/* Formula box */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-amber-300">
              <span className="text-[10px] text-slate-500 uppercase block mb-1 font-sans">
                Core Governing Equation
              </span>
              <code>{current.formula}</code>
            </div>

            {/* In-depth description */}
            <div className="text-xs leading-relaxed text-slate-300 space-y-3">
              <p>{current.description}</p>
            </div>

            {/* Interactive Proof Highlight */}
            <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-lg p-3 text-xs text-cyan-200 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300 block mb-0.5">Built Without Third-Party Physics Engines:</strong>
                All algorithms in VectorRigid are hand-coded from mathematical first principles in TypeScript, exactly reproducing the sequential impulse formulation established by Erin Catto and David Baraff.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>VectorRigid Physics Engine Engine Core</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
