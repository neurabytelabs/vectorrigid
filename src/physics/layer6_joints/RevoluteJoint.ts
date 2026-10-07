import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';
import { Body } from '../layer3_rigidbody/Body';

export class RevoluteJoint {
  public id: string;
  public bodyA: Body;
  public bodyB: Body;

  // Local anchor points relative to body centers
  public localAnchorA: Vec2;
  public localAnchorB: Vec2;

  // World lever arms computed during pre-step
  public rA: Vec2 = new Vec2();
  public rB: Vec2 = new Vec2();

  // 2x2 effective mass matrix K
  public massMatrix: Mat2 = new Mat2();

  // Accumulated impulse vector for warm starting
  public impulse: Vec2 = new Vec2();

  // Position stabilization bias
  public bias: Vec2 = new Vec2();

  // Visuals
  public color: string = '#f59e0b'; // amber pin

  constructor(
    bodyA: Body,
    bodyB: Body,
    worldAnchor: Vec2
  ) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.bodyA = bodyA;
    this.bodyB = bodyB;

    this.localAnchorA = bodyA.toLocalPoint(worldAnchor);
    this.localAnchorB = bodyB.toLocalPoint(worldAnchor);
  }

  preStep(dt: number, warmStarting = true): void {
    const invDt = dt > 0 ? 1 / dt : 0;

    // Convert local anchors to current world lever arms
    this.rA = this.bodyA.rotationMatrix.multiplyVec(this.localAnchorA);
    this.rB = this.bodyB.rotationMatrix.multiplyVec(this.localAnchorB);

    // K matrix formulation
    const mA = this.bodyA.invMass;
    const mB = this.bodyB.invMass;
    const iA = this.bodyA.invInertia;
    const iB = this.bodyB.invInertia;

    const k11 = mA + mB + iA * this.rA.y * this.rA.y + iB * this.rB.y * this.rB.y;
    const k12 = -iA * this.rA.x * this.rA.y - iB * this.rB.x * this.rB.y;
    const k21 = k12;
    const k22 = mA + mB + iA * this.rA.x * this.rA.x + iB * this.rB.x * this.rB.x;

    this.massMatrix.set(k11, k12, k21, k22);

    // Position error C = (pB + rB) - (pA + rA)
    const worldAnchorA = this.bodyA.position.add(this.rA);
    const worldAnchorB = this.bodyB.position.add(this.rB);
    const positionError = worldAnchorB.sub(worldAnchorA);

    // Baumgarte stabilization bias (beta = 0.2)
    // C = (pB + rB) - (pA + rA). If error > 0, deltaImpulse = -K^-1 * (Cdot + bias) must be negative on B
    const beta = 0.2;
    this.bias = positionError.scale(beta * invDt);

    // Warm starting
    if (warmStarting) {
      this.bodyA.applyImpulse(this.impulse.negate(), worldAnchorA);
      this.bodyB.applyImpulse(this.impulse, worldAnchorB);
    } else {
      this.impulse.set(0, 0);
    }
  }

  solveVelocity(): void {
    // Relative velocity at world anchor
    const vA = this.bodyA.getVelocityAtWorldPoint(this.bodyA.position.add(this.rA));
    const vB = this.bodyB.getVelocityAtWorldPoint(this.bodyB.position.add(this.rB));
    const relVel = vB.sub(vA);

    // C_dot + bias
    const Cdot = relVel.add(this.bias);

    // deltaImpulse = -K^-1 * (Cdot)
    const deltaImpulse = this.massMatrix.solve(Cdot).negate();

    this.impulse.addMut(deltaImpulse);

    const worldAnchorA = this.bodyA.position.add(this.rA);
    const worldAnchorB = this.bodyB.position.add(this.rB);

    this.bodyA.applyImpulse(deltaImpulse.negate(), worldAnchorA);
    this.bodyB.applyImpulse(deltaImpulse, worldAnchorB);
  }

  getWorldAnchorA(): Vec2 {
    return this.bodyA.toWorldPoint(this.localAnchorA);
  }

  getWorldAnchorB(): Vec2 {
    return this.bodyB.toWorldPoint(this.localAnchorB);
  }
}
