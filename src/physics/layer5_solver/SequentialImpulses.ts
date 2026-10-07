import { Vec2 } from '../math/Vec2';
import { Manifold, ContactPoint } from '../layer4_collision/Collision';

export interface WarmStartContactRecord {
  normalImpulse: number;
  tangentImpulse: number;
}

export class SequentialImpulseSolver {
  public warmStartingEnabled: boolean = true;
  public velocityIterations: number = 15;
  public positionSlop: number = 0.5; // pixels
  public baumgarteFactor: number = 0.25; // 0.2 - 0.3 for crisp stability without bouncing
  public warmStartMultiplier: number = 0.95; // slightly under 1.0 for hyper-stability

  // Persistent contact impulse cache: key -> { normalImpulse, tangentImpulse }
  private impulseCache: Map<string, WarmStartContactRecord> = new Map();

  /**
   * Generates a stable key for contact matching across frames
   */
  private getContactKey(idA: string, idB: string, featureId: number): string {
    return idA < idB ? `${idA}:${idB}:${featureId}` : `${idB}:${idA}:${featureId}`;
  }

  /**
   * Pre-step: compute effective masses, Baumgarte bias, and warm start
   */
  preStep(manifolds: Manifold[], dt: number): void {
    const invDt = dt > 0 ? 1 / dt : 0;

    for (const manifold of manifolds) {
      const { bodyA, bodyB } = manifold;
      const combinedFriction = Math.sqrt(bodyA.friction * bodyB.friction);
      const combinedRestitution = Math.max(bodyA.restitution, bodyB.restitution);

      for (const cp of manifold.contacts) {
        // Lever arms
        cp.rA = cp.position.sub(bodyA.position);
        cp.rB = cp.position.sub(bodyB.position);

        const rnA = cp.rA.cross(cp.normal);
        const rnB = cp.rB.cross(cp.normal);

        // Kn = 1/mA + 1/mB + (rA x n)^2 / IA + (rB x n)^2 / IB
        let kNormal = bodyA.invMass + bodyB.invMass;
        kNormal += bodyA.invInertia * rnA * rnA;
        kNormal += bodyB.invInertia * rnB * rnB;
        cp.normalMass = kNormal > 1e-9 ? 1 / kNormal : 0;

        // Kt = 1/mA + 1/mB + (rA x t)^2 / IA + (rB x t)^2 / IB
        const rtA = cp.rA.cross(cp.tangent);
        const rtB = cp.rB.cross(cp.tangent);
        let kTangent = bodyA.invMass + bodyB.invMass;
        kTangent += bodyA.invInertia * rtA * rtA;
        kTangent += bodyB.invInertia * rtB * rtB;
        cp.tangentMass = kTangent > 1e-9 ? 1 / kTangent : 0;

        // Relative velocity at contact
        const vA = bodyA.getVelocityAtWorldPoint(cp.position);
        const vB = bodyB.getVelocityAtWorldPoint(cp.position);
        const relVel = vB.sub(vA);
        const vRelN = relVel.dot(cp.normal);

        // Baumgarte position bias to resolve penetration
        const penetration = Math.max(0, cp.depth - this.positionSlop);
        const baumgarteBias = -this.baumgarteFactor * invDt * penetration;

        // Restitution bias (only if collision velocity exceeds threshold to prevent micro-chatter)
        let restitutionBias = 0;
        if (vRelN < -20.0) {
          restitutionBias = combinedRestitution * vRelN;
        }

        cp.velocityBias = baumgarteBias + restitutionBias;

        // Check warm starting cache
        const cacheKey = this.getContactKey(bodyA.id, bodyB.id, cp.featureId);
        const cached = this.impulseCache.get(cacheKey);

        if (this.warmStartingEnabled && cached) {
          cp.normalImpulse = cached.normalImpulse * this.warmStartMultiplier;
          cp.tangentImpulse = cached.tangentImpulse * this.warmStartMultiplier;

          // Apply warm starting impulse immediately!
          const P = cp.normal.scale(cp.normalImpulse).addMut(cp.tangent.scale(cp.tangentImpulse));
          bodyA.applyImpulse(P.negate(), cp.position);
          bodyB.applyImpulse(P, cp.position);
        } else {
          cp.normalImpulse = 0;
          cp.tangentImpulse = 0;
        }

        // Initialize iteration telemetry log for this contact point
        cp.iterationHistory = [
          {
            iteration: 0,
            normalImpulse: cp.normalImpulse,
            deltaNormal: 0,
            tangentImpulse: cp.tangentImpulse,
            relativeNormalVel: vRelN,
          },
        ];
      }
    }
  }

  /**
   * Clear warm-starting impulse cache (e.g. on scene reset)
   */
  clearCache(): void {
    this.impulseCache.clear();
  }

  /**
   * Perform a single iteration of sequential impulse solving across all contact manifolds
   */
  solveVelocityIteration(manifolds: Manifold[], iter: number): void {
    for (const manifold of manifolds) {
      const { bodyA, bodyB } = manifold;
      const frictionCoeff = Math.sqrt(bodyA.friction * bodyB.friction);

      for (const cp of manifold.contacts) {
        // 1. Solve Friction (Tangent impulse)
        const vA_t = bodyA.getVelocityAtWorldPoint(cp.position);
        const vB_t = bodyB.getVelocityAtWorldPoint(cp.position);
        const relVel_t = vB_t.sub(vA_t);
        const vt = relVel_t.dot(cp.tangent);

        const deltaLambdaT = -cp.tangentMass * vt;
        const maxFriction = frictionCoeff * cp.normalImpulse;

        const oldTangentImpulse = cp.tangentImpulse;
        cp.tangentImpulse = Math.max(-maxFriction, Math.min(maxFriction, oldTangentImpulse + deltaLambdaT));
        const appliedTangentImpulse = cp.tangentImpulse - oldTangentImpulse;

        const Pt = cp.tangent.scale(appliedTangentImpulse);
        bodyA.applyImpulse(Pt.negate(), cp.position);
        bodyB.applyImpulse(Pt, cp.position);

        // 2. Solve Normal (Non-penetration impulse)
        const vA_n = bodyA.getVelocityAtWorldPoint(cp.position);
        const vB_n = bodyB.getVelocityAtWorldPoint(cp.position);
        const relVel_n = vB_n.sub(vA_n);
        const vn = relVel_n.dot(cp.normal);

        // Target: vn + velocityBias = 0 => deltaLambdaN = -normalMass * (vn + velocityBias)
        const deltaLambdaN = -cp.normalMass * (vn + cp.velocityBias);

        const oldNormalImpulse = cp.normalImpulse;
        cp.normalImpulse = Math.max(0, oldNormalImpulse + deltaLambdaN);
        const appliedNormalImpulse = cp.normalImpulse - oldNormalImpulse;

        const Pn = cp.normal.scale(appliedNormalImpulse);
        bodyA.applyImpulse(Pn.negate(), cp.position);
        bodyB.applyImpulse(Pn, cp.position);

        // Record iteration convergence snapshot for deep inspection
        if (cp.iterationHistory) {
          cp.iterationHistory.push({
            iteration: iter,
            normalImpulse: cp.normalImpulse,
            deltaNormal: appliedNormalImpulse,
            tangentImpulse: cp.tangentImpulse,
            relativeNormalVel: vn,
          });
        }
      }
    }
  }

  /**
   * Perform sequential impulse iterations
   */
  solveVelocity(manifolds: Manifold[]): void {
    for (let iter = 1; iter <= this.velocityIterations; iter++) {
      this.solveVelocityIteration(manifolds, iter);
    }
  }

  /**
   * Post-step: cache accumulated impulses for the next frame's warm starting
   */
  postStep(manifolds: Manifold[]): void {
    const newCache: Map<string, WarmStartContactRecord> = new Map();

    for (const manifold of manifolds) {
      for (const cp of manifold.contacts) {
        if (cp.normalImpulse > 0 || Math.abs(cp.tangentImpulse) > 0) {
          const key = this.getContactKey(manifold.bodyA.id, manifold.bodyB.id, cp.featureId);
          newCache.set(key, {
            normalImpulse: cp.normalImpulse,
            tangentImpulse: cp.tangentImpulse,
          });
        }
      }
    }

    this.impulseCache = newCache;
  }
}
