import { Vec2 } from './math/Vec2';
import { Particle } from './layer1_particles/Particle';
import { ParticleConstraint } from './layer2_constraints/Constraint';
import { Body } from './layer3_rigidbody/Body';
import { CollisionDetector, Manifold } from './layer4_collision/Collision';
import { SequentialImpulseSolver } from './layer5_solver/SequentialImpulses';
import { RevoluteJoint } from './layer6_joints/RevoluteJoint';

export interface WorldStats {
  bodyCount: number;
  contactCount: number;
  jointCount: number;
  totalKineticEnergy: number;
  totalNormalImpulse: number;
  stepTimeMs: number;
}

export class PhysicsWorld {
  public particles: Particle[] = [];
  public constraints: ParticleConstraint[] = [];
  public bodies: Body[] = [];
  public joints: RevoluteJoint[] = [];
  public manifolds: Manifold[] = [];
  public gravity: Vec2 = new Vec2(0, 700); // 700 px/s^2 downwards
  public solver: SequentialImpulseSolver = new SequentialImpulseSolver();

  // Custom force pass (e.g. for central gravity in particle integrator orbits)
  public customForcePass?: (dt: number) => void;

  // Substepping for ultimate numerical precision
  public substeps: number = 2;

  // Selected contact for deep vector inspection
  public selectedContactKey: string | null = null;

  // Diagnostics
  public stats: WorldStats = {
    bodyCount: 0,
    contactCount: 0,
    jointCount: 0,
    totalKineticEnergy: 0,
    totalNormalImpulse: 0,
    stepTimeMs: 0,
  };

  addParticle(particle: Particle): Particle {
    this.particles.push(particle);
    return particle;
  }

  removeParticle(particle: Particle): void {
    const idx = this.particles.indexOf(particle);
    if (idx !== -1) {
      this.particles.splice(idx, 1);
      this.constraints = this.constraints.filter((c) => c.p1 !== particle && c.p2 !== particle);
    }
  }

  addConstraint(constraint: ParticleConstraint): ParticleConstraint {
    this.constraints.push(constraint);
    return constraint;
  }

  removeConstraint(constraint: ParticleConstraint): void {
    const idx = this.constraints.indexOf(constraint);
    if (idx !== -1) {
      this.constraints.splice(idx, 1);
    }
  }

  addBody(body: Body): Body {
    this.bodies.push(body);
    return body;
  }

  removeBody(body: Body): void {
    const idx = this.bodies.indexOf(body);
    if (idx !== -1) {
      this.bodies.splice(idx, 1);
      // Remove associated joints
      this.joints = this.joints.filter((j) => j.bodyA !== body && j.bodyB !== body);
    }
  }

  addJoint(joint: RevoluteJoint): RevoluteJoint {
    this.joints.push(joint);
    return joint;
  }

  removeJoint(joint: RevoluteJoint): void {
    const idx = this.joints.indexOf(joint);
    if (idx !== -1) {
      this.joints.splice(idx, 1);
    }
  }

  clear(): void {
    this.particles = [];
    this.constraints = [];
    this.bodies = [];
    this.joints = [];
    this.manifolds = [];
    this.customForcePass = undefined;
    this.solver.clearCache();
  }

  /**
   * Broadphase + Narrowphase collision generation
   */
  generateManifolds(): Manifold[] {
    const newManifolds: Manifold[] = [];
    const count = this.bodies.length;

    for (let i = 0; i < count; i++) {
      const bA = this.bodies[i];
      for (let j = i + 1; j < count; j++) {
        const bB = this.bodies[j];

        // Skip two static bodies
        if (bA.type === 'static' && bB.type === 'static') continue;

        const manifold = CollisionDetector.collide(bA, bB);
        if (manifold && manifold.contacts.length > 0) {
          newManifolds.push(manifold);
        }
      }
    }

    return newManifolds;
  }

  /**
   * Standard complete physics simulation step
   */
  step(dt: number): void {
    const startTime = performance.now();
    const subDt = dt / this.substeps;

    for (let s = 0; s < this.substeps; s++) {
      this.singleSubstep(subDt);
    }

    // Update stats
    let ke = 0;
    for (const b of this.bodies) {
      if (b.type !== 'static') {
        ke += 0.5 * b.mass * b.velocity.lengthSq() + 0.5 * b.inertia * b.angularVelocity * b.angularVelocity;
      }
    }
    for (const p of this.particles) {
      if (!p.isFixed) {
        ke += p.getKineticEnergy();
      }
    }

    let totalImpulse = 0;
    for (const m of this.manifolds) {
      for (const cp of m.contacts) {
        totalImpulse += cp.normalImpulse;
      }
    }

    this.stats = {
      bodyCount: this.bodies.length + this.particles.length,
      contactCount: this.manifolds.reduce((acc, m) => acc + m.contacts.length, 0),
      jointCount: this.joints.length + this.constraints.length,
      totalKineticEnergy: ke,
      totalNormalImpulse: totalImpulse,
      stepTimeMs: performance.now() - startTime,
    };
  }

  private singleSubstep(dt: number): void {
    // 0. Custom force pass (e.g. planetary gravity / springs)
    if (this.customForcePass) {
      this.customForcePass(dt);
    }

    // 1. Integrate velocities for rigid bodies
    for (const body of this.bodies) {
      body.integrateVelocity(dt, this.gravity);
    }

    // 2. Apply particle gravity & external forces
    for (const p of this.particles) {
      if (!p.isFixed) {
        p.applyForce(this.gravity.scale(p.mass));
      }
    }

    // 3. Continuous spring forces for constraints
    for (const c of this.constraints) {
      c.applyForce();
    }

    // 4. Integrate particle velocities & positions according to scheme
    for (const p of this.particles) {
      if (!p.isFixed) {
        p.integrate(dt);
        p.clearForces();
      }
    }

    // 5. Collision detection
    this.manifolds = this.generateManifolds();

    // 6. Pre-step constraints and contacts (including warm-starting)
    this.solver.preStep(this.manifolds, dt);

    for (const joint of this.joints) {
      joint.preStep(dt, this.solver.warmStartingEnabled);
    }

    // 7. Unified Sequential Impulse solve loop:
    // Solve joints, contacts, and rods/cables concurrently per Gauss-Seidel iteration!
    const iterations = this.solver.velocityIterations;
    for (let iter = 1; iter <= iterations; iter++) {
      // a. Solve revolute joints
      for (const joint of this.joints) {
        joint.solveVelocity();
      }

      // b. Solve contact velocities (friction + normal impulses)
      this.solver.solveVelocityIteration(this.manifolds, iter);

      // c. Solve bilateral rods and unilateral cables
      for (const c of this.constraints) {
        c.solveVelocity(dt);
      }
    }

    // 8. Post-step cache update for warm-starting
    this.solver.postStep(this.manifolds);

    // 9. Integrate positions for rigid bodies
    for (const body of this.bodies) {
      body.integratePosition(dt);
    }

    // 10. Position projection for particle constraints
    for (const c of this.constraints) {
      c.solvePosition(0.8);
    }
  }

  /**
   * Find nearest contact point to world coordinates
   */
  findNearestContact(point: Vec2, maxDistance = 30): { manifold: Manifold; contact: import('./layer4_collision/Collision').ContactPoint } | null {
    let nearest: { manifold: Manifold; contact: import('./layer4_collision/Collision').ContactPoint } | null = null;
    let minDist = maxDistance;

    for (const m of this.manifolds) {
      for (const cp of m.contacts) {
        const d = cp.position.distance(point);
        if (d < minDist) {
          minDist = d;
          nearest = { manifold: m, contact: cp };
        }
      }
    }

    return nearest;
  }
}
