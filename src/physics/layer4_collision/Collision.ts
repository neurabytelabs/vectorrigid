import { Vec2 } from '../math/Vec2';
import { Body } from '../layer3_rigidbody/Body';

export interface ContactPoint {
  position: Vec2; // World position of contact
  localA: Vec2; // Local anchor in Body A
  localB: Vec2; // Local anchor in Body B
  rA: Vec2; // Lever arm: position - bodyA.position
  rB: Vec2; // Lever arm: position - bodyB.position
  normal: Vec2; // Unit normal pointing from Body A to Body B
  tangent: Vec2; // Unit tangent vector (-normal.y, normal.x)
  depth: number; // Penetration depth (meters / pixels)
  featureId: number; // Persistent identifier for warm starting

  // Impulses
  normalImpulse: number; // Accumulated normal impulse lambda_n
  tangentImpulse: number; // Accumulated tangent/friction impulse lambda_t

  // Effective masses
  normalMass: number; // 1 / Kn
  tangentMass: number; // 1 / Kt
  velocityBias: number; // Baumgarte + restitution bias

  // Iteration tracking for live telemetry
  iterationHistory?: Array<{
    iteration: number;
    normalImpulse: number;
    deltaNormal: number;
    tangentImpulse: number;
    relativeNormalVel: number;
  }>;
}

export interface Manifold {
  bodyA: Body;
  bodyB: Body;
  contacts: ContactPoint[];
  normal: Vec2; // Main separating normal pointing from A to B
}

interface ClipVertex {
  v: Vec2;
  id: number;
}

export class CollisionDetector {
  /**
   * Main collision dispatcher between any two bodies
   */
  static collide(bodyA: Body, bodyB: Body): Manifold | null {
    // Broadphase AABB quick rejection test
    if (!this.checkAABBOverlap(bodyA.aabb, bodyB.aabb)) {
      return null;
    }

    if (bodyA.shapeType === 'circle' && bodyB.shapeType === 'circle') {
      return this.collideCircleCircle(bodyA, bodyB);
    } else if (bodyA.shapeType === 'circle' && bodyB.shapeType === 'box') {
      return this.collideCircleBox(bodyA, bodyB);
    } else if (bodyA.shapeType === 'box' && bodyB.shapeType === 'circle') {
      const manifold = this.collideCircleBox(bodyB, bodyA);
      if (manifold) {
        // Invert normal so it points from A to B
        manifold.bodyA = bodyA;
        manifold.bodyB = bodyB;
        manifold.normal = manifold.normal.negate();
        for (const cp of manifold.contacts) {
          cp.normal = cp.normal.negate();
          cp.tangent = cp.normal.perp();
          const tempLoc = cp.localA;
          cp.localA = cp.localB;
          cp.localB = tempLoc;
          const tempR = cp.rA;
          cp.rA = cp.rB;
          cp.rB = tempR;
        }
      }
      return manifold;
    } else if (bodyA.shapeType === 'box' && bodyB.shapeType === 'box') {
      return this.collideBoxBox(bodyA, bodyB);
    }
    return null;
  }

  static checkAABBOverlap(a: { min: Vec2; max: Vec2 }, b: { min: Vec2; max: Vec2 }): boolean {
    if (a.max.x < b.min.x || a.min.x > b.max.x) return false;
    if (a.max.y < b.min.y || a.min.y > b.max.y) return false;
    return true;
  }

  /**
   * Circle vs Circle Collision
   */
  static collideCircleCircle(bodyA: Body, bodyB: Body): Manifold | null {
    const diff = bodyB.position.sub(bodyA.position);
    const distSq = diff.lengthSq();
    const radiusSum = bodyA.radius + bodyB.radius;

    if (distSq > radiusSum * radiusSum) {
      return null;
    }

    const dist = Math.sqrt(distSq);
    let normal: Vec2;

    if (dist < 1e-6) {
      normal = new Vec2(0, 1);
    } else {
      normal = diff.scale(1 / dist);
    }

    const depth = radiusSum - dist;
    const contactPos = bodyA.position.addScaled(normal, bodyA.radius - depth * 0.5);
    const tangent = normal.perp();

    const contact: ContactPoint = {
      position: contactPos,
      localA: bodyA.toLocalPoint(contactPos),
      localB: bodyB.toLocalPoint(contactPos),
      rA: contactPos.sub(bodyA.position),
      rB: contactPos.sub(bodyB.position),
      normal,
      tangent,
      depth,
      featureId: 0,
      normalImpulse: 0,
      tangentImpulse: 0,
      normalMass: 0,
      tangentMass: 0,
      velocityBias: 0,
    };

    return {
      bodyA,
      bodyB,
      normal,
      contacts: [contact],
    };
  }

  /**
   * Circle vs Box Collision
   */
  static collideCircleBox(circleBody: Body, boxBody: Body): Manifold | null {
    // Transform circle center into box's local space
    const localCircle = boxBody.toLocalPoint(circleBody.position);

    // Clamp circle center to box half extents
    const clampedX = Math.max(-boxBody.halfWidth, Math.min(boxBody.halfWidth, localCircle.x));
    const clampedY = Math.max(-boxBody.halfHeight, Math.min(boxBody.halfHeight, localCircle.y));
    const localClamped = new Vec2(clampedX, clampedY);

    const localDiff = localCircle.sub(localClamped);
    const distSq = localDiff.lengthSq();

    let localNormal: Vec2;
    let depth: number;

    const inside = distSq < 1e-9;
    if (inside) {
      // Circle center is inside box - find distance to nearest face
      const dx = boxBody.halfWidth - Math.abs(localCircle.x);
      const dy = boxBody.halfHeight - Math.abs(localCircle.y);

      if (dx < dy) {
        localNormal = new Vec2(localCircle.x >= 0 ? 1 : -1, 0);
        depth = circleBody.radius + dx;
        localClamped.x = localCircle.x >= 0 ? boxBody.halfWidth : -boxBody.halfWidth;
      } else {
        localNormal = new Vec2(0, localCircle.y >= 0 ? 1 : -1);
        depth = circleBody.radius + dy;
        localClamped.y = localCircle.y >= 0 ? boxBody.halfHeight : -boxBody.halfHeight;
      }
    } else {
      const dist = Math.sqrt(distSq);
      if (dist > circleBody.radius) {
        return null; // No collision
      }
      localNormal = localDiff.scale(1 / dist);
      depth = circleBody.radius - dist;
    }

    // Convert local normal to world space (from box to circle)
    // Manifold requires normal pointing from BodyA (circle) to BodyB (box), so invert:
    const worldNormalBoxToCircle = boxBody.toWorldVector(localNormal);
    const normal = worldNormalBoxToCircle.negate(); // Circle -> Box
    const tangent = normal.perp();

    const contactWorldPos = boxBody.toWorldPoint(localClamped);

    const contact: ContactPoint = {
      position: contactWorldPos,
      localA: circleBody.toLocalPoint(contactWorldPos),
      localB: localClamped,
      rA: contactWorldPos.sub(circleBody.position),
      rB: contactWorldPos.sub(boxBody.position),
      normal,
      tangent,
      depth,
      featureId: 0,
      normalImpulse: 0,
      tangentImpulse: 0,
      normalMass: 0,
      tangentMass: 0,
      velocityBias: 0,
    };

    return {
      bodyA: circleBody,
      bodyB: boxBody,
      normal,
      contacts: [contact],
    };
  }

  /**
   * Box vs Box Collision using Separating Axis Theorem (SAT) + Sutherland-Hodgman Polygon Clipping
   * Produces 1 or 2 exact contact points!
   */
  static collideBoxBox(bodyA: Body, bodyB: Body): Manifold | null {
    // Relative translation vector
    const dp = bodyB.position.sub(bodyA.position);

    // Rotation matrices
    const R_A = bodyA.rotationMatrix;
    const R_B = bodyB.rotationMatrix;

    // Local axes in world coordinates
    const hA = new Vec2(bodyA.halfWidth, bodyA.halfHeight);
    const hB = new Vec2(bodyB.halfWidth, bodyB.halfHeight);

    // Box A axes
    const aX = new Vec2(R_A.m00, R_A.m10);
    const aY = new Vec2(R_A.m01, R_A.m11);

    // Box B axes
    const bX = new Vec2(R_B.m00, R_B.m10);
    const bY = new Vec2(R_B.m01, R_B.m11);

    // Test Box A's 2 face normals
    const sAX = Math.abs(dp.dot(aX)) - (hA.x + Math.abs(bX.dot(aX)) * hB.x + Math.abs(bY.dot(aX)) * hB.y);
    if (sAX > 0) return null;

    const sAY = Math.abs(dp.dot(aY)) - (hA.y + Math.abs(bX.dot(aY)) * hB.x + Math.abs(bY.dot(aY)) * hB.y);
    if (sAY > 0) return null;

    // Test Box B's 2 face normals
    const sBX = Math.abs(dp.dot(bX)) - (Math.abs(aX.dot(bX)) * hA.x + Math.abs(aY.dot(bX)) * hA.y + hB.x);
    if (sBX > 0) return null;

    const sBY = Math.abs(dp.dot(bY)) - (Math.abs(aX.dot(bY)) * hA.x + Math.abs(aY.dot(bY)) * hA.y + hB.y);
    if (sBY > 0) return null;

    // Best axis for Box A
    let sepA: number;
    let axisA: Vec2;
    if (sAX >= sAY) {
      sepA = sAX;
      axisA = dp.dot(aX) > 0 ? aX : aX.negate();
    } else {
      sepA = sAY;
      axisA = dp.dot(aY) > 0 ? aY : aY.negate();
    }

    // Best axis for Box B
    let sepB: number;
    let axisB: Vec2;
    if (sBX >= sBY) {
      sepB = sBX;
      axisB = dp.dot(bX) > 0 ? bX.negate() : bX;
    } else {
      sepB = sBY;
      axisB = dp.dot(bY) > 0 ? bY.negate() : bY;
    }

    // Bias favors Box A slightly to prevent frame-to-frame reference face flipping jitter
    const kRelTol = 0.95;
    const kAbsTol = 0.01;

    let axis: Vec2;
    let referenceBody: Body;
    let incidentBody: Body;

    if (sepB > kRelTol * sepA + kAbsTol) {
      axis = axisB;
      referenceBody = bodyB;
      incidentBody = bodyA;
    } else {
      axis = axisA;
      referenceBody = bodyA;
      incidentBody = bodyB;
    }

    // Identify Incident Edge on the Incident Body:
    // Edge of incidentBody whose outward normal is most anti-parallel to the reference face normal (axis)
    const incidentVertices = incidentBody.vertices;
    let incidentEdgeIndex = 0;
    let minDot = Infinity;

    for (let i = 0; i < 4; i++) {
      const normal = incidentBody.normals[i];
      const d = normal.dot(axis);
      if (d < minDot) {
        minDot = d;
        incidentEdgeIndex = i;
      }
    }

    // Vertices of incident edge
    const iV1 = incidentVertices[incidentEdgeIndex];
    const iV2 = incidentVertices[(incidentEdgeIndex + 1) % 4];

    const incidentEdge: ClipVertex[] = [
      { v: iV1.clone(), id: incidentEdgeIndex * 2 },
      { v: iV2.clone(), id: incidentEdgeIndex * 2 + 1 },
    ];

    // Identify Reference Edge on Reference Body:
    // Edge whose outward normal has the highest alignment with axis
    let refEdgeIndex = 0;
    let maxDot = -Infinity;
    for (let i = 0; i < 4; i++) {
      const normal = referenceBody.normals[i];
      const d = normal.dot(axis);
      if (d > maxDot) {
        maxDot = d;
        refEdgeIndex = i;
      }
    }

    const rV1 = referenceBody.vertices[refEdgeIndex];
    const rV2 = referenceBody.vertices[(refEdgeIndex + 1) % 4];

    // Reference edge tangent and front normal
    const refEdgeVec = rV2.sub(rV1).normalize();
    const refNormal = referenceBody.normals[refEdgeIndex];

    // Side Plane 1: at rV1 pointing along refEdgeVec towards rV2
    // Inside condition: refEdgeVec . (v - rV1) >= 0
    const clipped1 = this.clipSegmentToLine(incidentEdge, refEdgeVec, refEdgeVec.dot(rV1));
    if (clipped1.length < 2) return null;

    // Side Plane 2: at rV2 pointing opposite refEdgeVec towards rV1
    // Inside condition: -refEdgeVec . (v - rV2) >= 0
    const negRefEdgeVec = refEdgeVec.negate();
    const clipped2 = this.clipSegmentToLine(clipped1, negRefEdgeVec, negRefEdgeVec.dot(rV2));
    if (clipped2.length < 2) return null;

    // Clip against front plane (refNormal, refNormal . rV1) and keep points behind it
    const frontOffset = refNormal.dot(rV1);
    const contacts: ContactPoint[] = [];

    // Manifold normal must point from BodyA to BodyB
    const normal = referenceBody === bodyA ? refNormal : refNormal.negate();
    const tangent = normal.perp();

    for (let i = 0; i < clipped2.length; i++) {
      const cp = clipped2[i];
      const separationToFront = refNormal.dot(cp.v) - frontOffset;

      if (separationToFront <= 0) {
        // Point is penetrating front face
        const depth = -separationToFront;
        const contactPos = cp.v.addScaled(refNormal, depth * 0.5);

        contacts.push({
          position: contactPos,
          localA: bodyA.toLocalPoint(contactPos),
          localB: bodyB.toLocalPoint(contactPos),
          rA: contactPos.sub(bodyA.position),
          rB: contactPos.sub(bodyB.position),
          normal,
          tangent,
          depth,
          featureId: (refEdgeIndex << 4) | (cp.id & 0x0f),
          normalImpulse: 0,
          tangentImpulse: 0,
          normalMass: 0,
          tangentMass: 0,
          velocityBias: 0,
        });
      }
    }

    if (contacts.length === 0) return null;

    return {
      bodyA,
      bodyB,
      normal,
      contacts,
    };
  }

  /**
   * Sutherland-Hodgman segment clipping against half-plane: n . v - offset >= 0
   * Preserves orientation order along the directed segment!
   */
  private static clipSegmentToLine(vIn: ClipVertex[], normal: Vec2, offset: number): ClipVertex[] {
    const vOut: ClipVertex[] = [];
    if (vIn.length < 2) return vOut;

    const d0 = normal.dot(vIn[0].v) - offset;
    const d1 = normal.dot(vIn[1].v) - offset;

    // If point 0 is inside (in front of or on plane), keep it
    if (d0 >= 0) {
      vOut.push(vIn[0]);
    }

    // If the edge crosses the plane, insert intersection point
    if (d0 * d1 < 0) {
      const alpha = d0 / (d0 - d1);
      const intersect = vIn[0].v.lerp(vIn[1].v, alpha);
      vOut.push({
        v: intersect,
        id: (vIn[0].id & ~1) | 0x80, // Unique edge-clipped feature ID
      });
    }

    // If point 1 is inside, keep it
    if (d1 >= 0) {
      vOut.push(vIn[1]);
    }

    return vOut;
  }
}
