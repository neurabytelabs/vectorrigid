import { Vec2 } from '../math/Vec2';
import { Particle } from '../layer1_particles/Particle';

export type ConstraintType = 'rod' | 'cable' | 'spring';

export class ParticleConstraint {
  public p1: Particle;
  public p2: Particle;
  public length: number;
  public type: ConstraintType;
  public stiffness: number; // for spring or compliance
  public damping: number;
  public currentTension: number = 0; // Recorded tension force for visualization

  constructor(
    p1: Particle,
    p2: Particle,
    type: ConstraintType = 'rod',
    targetLength?: number,
    stiffness = 1.0,
    damping = 0.05
  ) {
    this.p1 = p1;
    this.p2 = p2;
    this.type = type;
    this.length = targetLength !== undefined ? targetLength : p1.position.distance(p2.position);
    this.stiffness = stiffness;
    this.damping = damping;
  }

  /**
   * Continuous force pass (for springs and damping)
   */
  applyForce(): void {
    if (this.type !== 'spring') return;

    const delta = this.p2.position.sub(this.p1.position);
    const currentDist = delta.length();
    if (currentDist < 1e-6) return;

    const dir = delta.scale(1 / currentDist);
    const displacement = currentDist - this.length;
    const relVel = this.p2.velocity.sub(this.p1.velocity);
    const dampingForce = relVel.dot(dir) * this.damping;

    const springMagnitude = this.stiffness * displacement + dampingForce;
    this.currentTension = springMagnitude;

    const f = dir.scale(springMagnitude);
    this.p1.applyForce(f);
    this.p2.applyForce(f.negate());
  }

  /**
   * Direct constraint resolution (Velocity impulse / position projection)
   */
  solvePosition(relaxation = 1.0): void {
    if (this.type === 'spring') return;

    const delta = this.p2.position.sub(this.p1.position);
    const dist = delta.length();
    if (dist < 1e-6) return;

    const error = dist - this.length;

    // Cable only acts when stretched (tension), never in compression!
    if (this.type === 'cable' && error < 0) {
      this.currentTension = 0;
      return;
    }

    const totalInvMass = this.p1.invMass + this.p2.invMass;
    if (totalInvMass < 1e-8) return;

    const normal = delta.scale(1 / dist);
    const correction = error * relaxation / totalInvMass;
    this.currentTension = Math.abs(error * 100);

    if (!this.p1.isFixed) {
      this.p1.position.addScaledMut(normal, correction * this.p1.invMass);
    }
    if (!this.p2.isFixed) {
      this.p2.position.addScaledMut(normal, -correction * this.p2.invMass);
    }
  }

  /**
   * Velocity impulse solver for rods and cables:
   * J * v = 0 => (v2 - v1) . n = 0
   */
  solveVelocity(dt: number): void {
    if (this.type === 'spring') return;

    const delta = this.p2.position.sub(this.p1.position);
    const dist = delta.length();
    if (dist < 1e-6) return;

    // Slack cable check
    if (this.type === 'cable' && dist < this.length) {
      return;
    }

    const n = delta.scale(1 / dist);
    const totalInvMass = this.p1.invMass + this.p2.invMass;
    if (totalInvMass < 1e-8) return;

    // Relative velocity along constraint normal
    const vRel = this.p2.velocity.sub(this.p1.velocity);
    const vNormal = vRel.dot(n);

    // Baumgarte stabilization bias
    const beta = 0.2;
    const error = dist - this.length;
    const bias = (beta / dt) * error;

    const lambda = -(vNormal + bias) / totalInvMass;

    // Cable cannot exert positive impulse (compression pushes bodies apart; cables go slack)
    if (this.type === 'cable' && lambda > 0) return;

    this.currentTension = Math.abs(lambda);

    const impulse = n.scale(lambda);
    this.p1.velocity.addScaledMut(impulse, -this.p1.invMass);
    this.p2.velocity.addScaledMut(impulse, this.p2.invMass);
  }
}
