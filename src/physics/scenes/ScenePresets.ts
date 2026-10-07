import { Vec2 } from '../math/Vec2';
import { Body } from '../layer3_rigidbody/Body';
import { RevoluteJoint } from '../layer6_joints/RevoluteJoint';
import { Particle } from '../layer1_particles/Particle';
import { ParticleConstraint } from '../layer2_constraints/Constraint';
import { PhysicsWorld } from '../PhysicsWorld';

export type SceneId =
  | 'pyramid_wrecking_ball'
  | 'sat_manifold_lab'
  | 'torque_inertia'
  | 'rods_and_cables'
  | 'particle_integrators';

export interface SceneConfig {
  id: SceneId;
  name: string;
  layerTitle: string;
  description: string;
  setup: (world: PhysicsWorld) => { wreckingBall?: Body; focalPoint?: Vec2; defaultZoom?: number };
}

export const SCENE_PRESETS: SceneConfig[] = [
  {
    id: 'pyramid_wrecking_ball',
    name: 'Pyramid & Wrecking Ball',
    layerTitle: 'Layers 5 & 6: Sequential Impulses & Revolute Joints',
    description:
      'A 6-tier pyramid of 21 rigid boxes resolving every contact under sequential impulses with warm starting. Smash it with a heavy steel wrecking ball suspended on a revolute joint chain!',
    setup: (world: PhysicsWorld) => {
      world.clear();
      world.gravity.set(0, 800);
      world.solver.warmStartingEnabled = true;
      world.solver.velocityIterations = 18;

      // 1. Static Ground and Walls
      const ground = new Body({
        x: 650,
        y: 650,
        width: 1400,
        height: 60,
        type: 'static',
        color: '#1e293b',
        friction: 0.6,
        restitution: 0.05,
        label: 'Foundation Bedrock',
      });
      world.addBody(ground);

      // Left retaining barrier
      world.addBody(
        new Body({
          x: 20,
          y: 350,
          width: 40,
          height: 700,
          type: 'static',
          color: '#1e293b',
          friction: 0.4,
          label: 'Left Wall',
        })
      );

      // Right backstop
      world.addBody(
        new Body({
          x: 1280,
          y: 350,
          width: 40,
          height: 700,
          type: 'static',
          color: '#1e293b',
          friction: 0.4,
          label: 'Right Wall',
        })
      );

      // 2. Pyramid of Boxes (6 tiers: 6, 5, 4, 3, 2, 1 = 21 boxes)
      const boxW = 54;
      const boxH = 46;
      const boxSpacingX = 58;
      const boxSpacingY = 48;
      const startX = 720;
      const groundY = 620 - boxH / 2;
      const tiers = 6;

      const palette = [
        '#38bdf8', // sky blue
        '#60a5fa', // blue
        '#818cf8', // indigo
        '#a78bfa', // purple
        '#c084fc', // fuchsia
        '#f472b6', // pink
      ];

      let boxIndex = 1;
      for (let tier = 0; tier < tiers; tier++) {
        const count = tiers - tier;
        const tierY = groundY - tier * boxSpacingY;
        const tierStartX = startX - ((count - 1) * boxSpacingX) / 2;

        for (let i = 0; i < count; i++) {
          const bx = tierStartX + i * boxSpacingX;
          const box = new Body({
            x: bx,
            y: tierY,
            width: boxW,
            height: boxH,
            type: 'dynamic',
            mass: 4.0, // 4 kg per box
            friction: 0.55,
            restitution: 0.05,
            color: palette[tier % palette.length],
            label: `Tier ${tier + 1} Box #${boxIndex++}`,
          });
          world.addBody(box);
        }
      }

      // 3. Heavy Wrecking Ball & Revolute Joint Chain
      // Overhead gantry anchor positioned so ball pulls back naturally
      const gantryAnchor = new Body({
        x: 340,
        y: 80,
        width: 60,
        height: 24,
        type: 'static',
        color: '#475569',
        label: 'Gantry Crane Anchor',
      });
      world.addBody(gantryAnchor);

      // Chain pulled back at angle theta (up-left)
      const linkCount = 5;
      const linkLength = 48;
      const linkWidth = 10;
      const swingAngle = -0.72; // ~ -41 degrees
      const u = new Vec2(Math.sin(swingAngle), Math.cos(swingAngle)); // unit vector along chain
      const dStep = u.scale(linkLength);

      let prevBody: Body = gantryAnchor;
      let currentAnchor = new Vec2(340, 80);

      for (let k = 0; k < linkCount; k++) {
        const nextAnchor = currentAnchor.add(dStep);
        const linkCenter = currentAnchor.add(nextAnchor).scale(0.5);

        const link = new Body({
          x: linkCenter.x,
          y: linkCenter.y,
          width: linkWidth,
          height: linkLength,
          type: 'dynamic',
          mass: 1.6,
          color: '#64748b',
          friction: 0.3,
          label: `Chain Link ${k + 1}`,
        });
        link.angle = -swingAngle;
        link.updateTransform();
        world.addBody(link);

        // Pin joint at top anchor
        world.addJoint(new RevoluteJoint(prevBody, link, currentAnchor));

        prevBody = link;
        currentAnchor = nextAnchor;
      }

      // Heavy wrecking ball attached to final chain link
      const ballRadius = 35;
      const ballCenter = currentAnchor.addScaled(u, ballRadius);
      const wreckingBall = new Body({
        x: ballCenter.x,
        y: ballCenter.y,
        shapeType: 'circle',
        radius: ballRadius,
        type: 'dynamic',
        mass: 75.0, // 75 kg massive wrecking ball
        restitution: 0.35,
        friction: 0.45,
        color: '#f59e0b', // glowing amber steel
        label: 'Super-Dense Wrecking Ball',
      });
      world.addBody(wreckingBall);

      // Joint connects final link and ball at currentAnchor
      world.addJoint(new RevoluteJoint(prevBody, wreckingBall, currentAnchor));

      // Initial swing momentum towards pyramid
      wreckingBall.velocity.set(60, 0);

      return {
        wreckingBall,
        focalPoint: new Vec2(650, 420),
        defaultZoom: 1.0,
      };
    },
  },
  {
    id: 'sat_manifold_lab',
    name: 'Separating Axis Theorem (SAT)',
    layerTitle: 'Layer 4: SAT Manifold Clipping Lab',
    description:
      'Inspect 4 separating axes, projection intervals, incident/reference face identification, and polygon clipping down to exact contact pairs.',
    setup: (world: PhysicsWorld) => {
      world.clear();
      world.gravity.set(0, 0); // zero-g for pristine geometric inspection
      world.solver.warmStartingEnabled = true;

      const boxA = new Body({
        x: 480,
        y: 350,
        width: 140,
        height: 100,
        type: 'dynamic',
        mass: 10,
        color: '#3b82f6',
        label: 'Box A (Reference)',
      });
      boxA.angle = 0.2;
      boxA.updateTransform();
      world.addBody(boxA);

      const boxB = new Body({
        x: 610,
        y: 330,
        width: 110,
        height: 120,
        type: 'dynamic',
        mass: 10,
        color: '#10b981',
        label: 'Box B (Incident)',
      });
      boxB.angle = -0.35;
      boxB.updateTransform();
      world.addBody(boxB);

      return {
        focalPoint: new Vec2(540, 340),
        defaultZoom: 1.6,
      };
    },
  },
  {
    id: 'torque_inertia',
    name: 'Torque & Angular Momentum',
    layerTitle: 'Layer 3: Moments of Inertia & Torques',
    description:
      'Off-center impact demonstrations proving linear and angular momentum conservation: tau = r x F and delta_omega = (r x J) / I.',
    setup: (world: PhysicsWorld) => {
      world.clear();
      world.gravity.set(0, 200);

      // Static ground
      world.addBody(
        new Body({
          x: 600,
          y: 600,
          width: 1000,
          height: 40,
          type: 'static',
          color: '#1e293b',
          friction: 0.7,
        })
      );

      // Long balance beam pinned in center
      const pivot = new Body({
        x: 600,
        y: 420,
        shapeType: 'circle',
        radius: 12,
        type: 'static',
        color: '#94a3b8',
        label: 'Pivot Pin',
      });
      world.addBody(pivot);

      const seesaw = new Body({
        x: 600,
        y: 420,
        width: 440,
        height: 24,
        type: 'dynamic',
        mass: 12,
        color: '#6366f1',
        friction: 0.6,
        label: 'Moment Beam',
      });
      world.addBody(seesaw);

      world.addJoint(new RevoluteJoint(pivot, seesaw, new Vec2(600, 420)));

      // Left dropping weight
      const leftWeight = new Body({
        x: 430,
        y: 200,
        width: 40,
        height: 40,
        type: 'dynamic',
        mass: 8,
        color: '#f43f5e',
        label: 'Lever Mass 1',
      });
      world.addBody(leftWeight);

      // Right dropping weight
      const rightWeight = new Body({
        x: 770,
        y: 120,
        width: 30,
        height: 30,
        type: 'dynamic',
        mass: 14,
        color: '#ec4899',
        label: 'Lever Mass 2',
      });
      world.addBody(rightWeight);

      return {
        focalPoint: new Vec2(600, 400),
        defaultZoom: 1.1,
      };
    },
  },
  {
    id: 'rods_and_cables',
    name: 'Rods, Cables & Suspension',
    layerTitle: 'Layer 2: Bilateral Rods vs Unilateral Cables',
    description:
      'Rigid bilateral rods resist tension AND compression, while unilateral cables collapse when compressed. Observe rods, cables, and damped springs side-by-side!',
    setup: (world: PhysicsWorld) => {
      world.clear();
      world.gravity.set(0, 500);

      // 1. Bilateral Rod Pendulum (Left) - Resists stretching AND compression
      const anchorRod = world.addParticle(new Particle(360, 160, 1, 8, '#94a3b8', true, 'semi_implicit_euler', 'Fixed Pin'));
      const bobRod = world.addParticle(new Particle(480, 160, 5, 12, '#06b6d4', false, 'semi_implicit_euler', 'Bilateral Rod Bob'));
      bobRod.velocity.set(0, 60);
      world.addConstraint(new ParticleConstraint(anchorRod, bobRod, 'rod', 120));

      // 2. Unilateral Cable Suspension (Center) - Holds tension, goes slack under compression!
      const anchorCable = world.addParticle(new Particle(620, 160, 1, 8, '#94a3b8', true, 'semi_implicit_euler', 'Cable Pin'));
      const bobCable = world.addParticle(new Particle(740, 160, 5, 12, '#f59e0b', false, 'semi_implicit_euler', 'Unilateral Cable Bob'));
      bobCable.velocity.set(0, -160); // Fling upwards to demonstrate cable buckling into slack!
      world.addConstraint(new ParticleConstraint(anchorCable, bobCable, 'cable', 120));

      // 3. Damped Spring-Mass Oscillator (Right)
      const anchorSpring = world.addParticle(new Particle(880, 160, 1, 8, '#94a3b8', true, 'semi_implicit_euler', 'Spring Pin'));
      const bobSpring = world.addParticle(new Particle(880, 320, 4, 12, '#ec4899', false, 'semi_implicit_euler', 'Damped Spring Mass'));
      world.addConstraint(new ParticleConstraint(anchorSpring, bobSpring, 'spring', 100, 45, 0.25));

      return {
        focalPoint: new Vec2(620, 260),
        defaultZoom: 1.15,
      };
    },
  },
  {
    id: 'particle_integrators',
    name: 'Particle Integrator Orbits',
    layerTitle: 'Layer 1: Explicit vs Symplectic Euler vs Verlet',
    description:
      'Proves why physics engines must use Symplectic Euler or Verlet: Explicit Euler gains spurious energy and spirals out, while Symplectic Euler preserves Hamiltonian orbital phase volume.',
    setup: (world: PhysicsWorld) => {
      world.clear();
      world.gravity.set(0, 0); // Pure central gravitational orbital field

      // Central attractor (Sun)
      const sun = world.addParticle(
        new Particle(600, 350, 10000, 24, '#fbbf24', true, 'semi_implicit_euler', 'Attractor (M)')
      );

      // 1. Red: Explicit Euler (Spiral instability due to spurious energy gain)
      const pExplicit = world.addParticle(
        new Particle(600, 210, 1, 8, '#f43f5e', false, 'explicit_euler', 'Explicit Euler (Spurious Energy Gain)')
      );
      pExplicit.velocity.set(168, 0);

      // 2. Cyan: Symplectic (Semi-Implicit) Euler (Stable bounded ellipse)
      const pSymplectic = world.addParticle(
        new Particle(600, 210, 1, 8, '#38bdf8', false, 'semi_implicit_euler', 'Symplectic Euler (Conserved Phase)')
      );
      pSymplectic.velocity.set(168, 0);

      // 3. Emerald: Verlet (Time-reversible, excellent Hamiltonian orbit)
      const pVerlet = world.addParticle(
        new Particle(600, 210, 1, 8, '#10b981', false, 'verlet', 'Verlet (Time-Reversible)')
      );
      pVerlet.velocity.set(168, 0);
      pVerlet.prevPosition.set(600 - 168 * (1 / 60), 210);

      // Central Newtonian gravity: F = -G * M * m / r^2
      world.customForcePass = () => {
        const G = 3950000;
        const dynamicParticles = [pExplicit, pSymplectic, pVerlet];
        for (const p of dynamicParticles) {
          const diff = sun.position.sub(p.position);
          const dist = Math.max(diff.length(), 20);
          const fMag = (G * p.mass) / (dist * dist);
          const force = diff.scale(fMag / dist);
          p.applyForce(force);
        }
      };

      return {
        focalPoint: new Vec2(600, 350),
        defaultZoom: 1.15,
      };
    },
  },
];
