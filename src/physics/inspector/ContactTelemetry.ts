import { Vec2 } from '../math/Vec2';
import { Body } from '../layer3_rigidbody/Body';
import { Manifold, ContactPoint } from '../layer4_collision/Collision';

export interface InspectedContactData {
  bodyA: Body;
  bodyB: Body;
  contactPoint: ContactPoint;
  manifoldNormal: Vec2;

  // Exact vector quantities
  worldPos: Vec2;
  normal: Vec2;
  tangent: Vec2;
  rA: Vec2;
  rB: Vec2;
  depth: number;

  // Velocities
  velA: Vec2;
  velB: Vec2;
  omegaA: number;
  omegaB: number;
  relVel: Vec2;
  normalVel: number;
  tangentVel: number;

  // Mass & Impulses
  effectiveNormalMass: number;
  effectiveTangentMass: number;
  accumulatedNormalImpulse: number;
  accumulatedTangentImpulse: number;

  // Equivalent force over timestep
  effectiveNormalForce: number; // N or kg*px/s^2
  effectiveFrictionForce: number;

  // Iteration-by-iteration convergence table
  iterationLog: Array<{
    iteration: number;
    normalImpulse: number;
    deltaNormal: number;
    tangentImpulse: number;
    relativeNormalVel: number;
  }>;
}

export function extractContactTelemetry(
  manifold: Manifold,
  contact: ContactPoint,
  dt: number
): InspectedContactData {
  const { bodyA, bodyB } = manifold;
  const invDt = dt > 0 ? 1 / dt : 60;

  const velA = bodyA.getVelocityAtWorldPoint(contact.position);
  const velB = bodyB.getVelocityAtWorldPoint(contact.position);
  const relVel = velB.sub(velA);
  const normalVel = relVel.dot(contact.normal);
  const tangentVel = relVel.dot(contact.tangent);

  return {
    bodyA,
    bodyB,
    contactPoint: contact,
    manifoldNormal: manifold.normal,
    worldPos: contact.position.clone(),
    normal: contact.normal.clone(),
    tangent: contact.tangent.clone(),
    rA: contact.rA.clone(),
    rB: contact.rB.clone(),
    depth: contact.depth,
    velA,
    velB,
    omegaA: bodyA.angularVelocity,
    omegaB: bodyB.angularVelocity,
    relVel,
    normalVel,
    tangentVel,
    effectiveNormalMass: contact.normalMass,
    effectiveTangentMass: contact.tangentMass,
    accumulatedNormalImpulse: contact.normalImpulse,
    accumulatedTangentImpulse: contact.tangentImpulse,
    effectiveNormalForce: contact.normalImpulse * invDt,
    effectiveFrictionForce: contact.tangentImpulse * invDt,
    iterationLog: contact.iterationHistory ? [...contact.iterationHistory] : [],
  };
}
