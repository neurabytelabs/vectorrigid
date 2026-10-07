import { Vec2 } from '../math/Vec2';
import { Mat2 } from '../math/Mat2';

export type BodyType = 'dynamic' | 'static' | 'kinematic';
export type ShapeType = 'circle' | 'box';

export interface AABB {
  min: Vec2;
  max: Vec2;
}

export class Body {
  public id: string;
  public label?: string;
  public type: BodyType;
  public shapeType: ShapeType;

  // Linear motion
  public position: Vec2;
  public velocity: Vec2;
  public force: Vec2;
  public mass: number = 1.0;
  public invMass: number = 1.0;

  // Angular motion
  public angle: number = 0; // radians
  public angularVelocity: number = 0; // rad/s
  public torque: number = 0;
  public inertia: number = 1.0;
  public invInertia: number = 1.0;

  // Geometry parameters
  public radius: number = 10; // for circle
  public halfWidth: number = 15; // for box (extent x)
  public halfHeight: number = 15; // for box (extent y)

  // Material properties
  public restitution: number = 0.1; // bounciness (low by default for realistic stable stacks)
  public friction: number = 0.55; // Coulomb coefficient of friction

  // Cached geometry
  public vertices: Vec2[] = []; // 4 world vertices for box
  public normals: Vec2[] = []; // 4 world edge outward normals for box
  public aabb: AABB = { min: new Vec2(), max: new Vec2() };
  public rotationMatrix: Mat2 = Mat2.identity();

  // Visuals
  public color: string = '#60a5fa';
  public strokeColor: string = '#93c5fd';

  constructor(options: {
    x: number;
    y: number;
    type?: BodyType;
    shapeType?: ShapeType;
    radius?: number;
    width?: number;
    height?: number;
    mass?: number;
    restitution?: number;
    friction?: number;
    color?: string;
    label?: string;
  }) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.label = options.label;
    this.type = options.type || 'dynamic';
    this.shapeType = options.shapeType || 'box';
    this.position = new Vec2(options.x, options.y);
    this.velocity = new Vec2(0, 0);
    this.force = new Vec2(0, 0);

    if (options.color) this.color = options.color;

    if (this.shapeType === 'circle') {
      this.radius = options.radius ?? 15;
    } else {
      const w = options.width ?? 30;
      const h = options.height ?? 30;
      this.halfWidth = w / 2;
      this.halfHeight = h / 2;
    }

    if (options.restitution !== undefined) this.restitution = options.restitution;
    if (options.friction !== undefined) this.friction = options.friction;

    this.computeMassAndInertia(options.mass);
    this.updateTransform();
  }

  computeMassAndInertia(specifiedMass?: number): void {
    if (this.type === 'static') {
      this.mass = Infinity;
      this.invMass = 0;
      this.inertia = Infinity;
      this.invInertia = 0;
      return;
    }

    // Default density = 1.0
    if (this.shapeType === 'circle') {
      this.mass = specifiedMass ?? Math.PI * this.radius * this.radius * 0.002;
      // Moment of inertia for solid disc: I = 0.5 * m * r^2
      this.inertia = 0.5 * this.mass * this.radius * this.radius;
    } else {
      const w = this.halfWidth * 2;
      const h = this.halfHeight * 2;
      this.mass = specifiedMass ?? w * h * 0.002;
      // Moment of inertia for solid rectangle: I = (1/12) * m * (w^2 + h^2)
      this.inertia = (1 / 12) * this.mass * (w * w + h * h);
    }

    this.invMass = this.mass > 0 ? 1 / this.mass : 0;
    this.invInertia = this.inertia > 0 ? 1 / this.inertia : 0;
  }

  updateTransform(): void {
    this.rotationMatrix.setFromAngle(this.angle);

    if (this.shapeType === 'box') {
      const cos = Math.cos(this.angle);
      const sin = Math.sin(this.angle);

      // Local box vertices (counter-clockwise)
      // 0: top-right, 1: top-left, 2: bottom-left, 3: bottom-right
      const hw = this.halfWidth;
      const hh = this.halfHeight;

      const lx = [hw, -hw, -hw, hw];
      const ly = [hh, hh, -hh, -hh];

      this.vertices = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      for (let i = 0; i < 4; i++) {
        const wx = this.position.x + (lx[i] * cos - ly[i] * sin);
        const wy = this.position.y + (lx[i] * sin + ly[i] * cos);
        const v = new Vec2(wx, wy);
        this.vertices.push(v);

        if (wx < minX) minX = wx;
        if (wy < minY) minY = wy;
        if (wx > maxX) maxX = wx;
        if (wy > maxY) maxY = wy;
      }

      this.aabb = {
        min: new Vec2(minX, minY),
        max: new Vec2(maxX, maxY),
      };

      // World outward face normals:
      // Edge 0 (TR -> TL): normal is (sin, cos) in screen coords (taking screen Y down into account)
      // Standard 2D coordinate system outward normals:
      // Face 0: (0, 1) rotated => (-sin, cos)
      // Face 1: (-1, 0) rotated => (-cos, -sin)
      // Face 2: (0, -1) rotated => (sin, -cos)
      // Face 3: (1, 0) rotated => (cos, sin)
      this.normals = [
        new Vec2(-sin, cos), // Top
        new Vec2(-cos, -sin), // Left
        new Vec2(sin, -cos), // Bottom
        new Vec2(cos, sin), // Right
      ];
    } else {
      // Circle AABB
      this.aabb = {
        min: new Vec2(this.position.x - this.radius, this.position.y - this.radius),
        max: new Vec2(this.position.x + this.radius, this.position.y + this.radius),
      };
    }
  }

  toWorldPoint(localPoint: Vec2): Vec2 {
    return this.rotationMatrix.multiplyVec(localPoint).addMut(this.position);
  }

  toLocalPoint(worldPoint: Vec2): Vec2 {
    const diff = worldPoint.sub(this.position);
    return this.rotationMatrix.transpose().multiplyVec(diff);
  }

  toWorldVector(localVec: Vec2): Vec2 {
    return this.rotationMatrix.multiplyVec(localVec);
  }

  toLocalVector(worldVec: Vec2): Vec2 {
    return this.rotationMatrix.transpose().multiplyVec(worldVec);
  }

  getVelocityAtWorldPoint(point: Vec2): Vec2 {
    const r = point.sub(this.position);
    // v_p = v + omega x r = v + (-omega * r.y, omega * r.x)
    return new Vec2(
      this.velocity.x - this.angularVelocity * r.y,
      this.velocity.y + this.angularVelocity * r.x
    );
  }

  applyForce(f: Vec2, atPoint?: Vec2): void {
    if (this.type === 'static') return;
    this.force.addMut(f);
    if (atPoint) {
      const r = atPoint.sub(this.position);
      // tau = r x F
      this.torque += r.cross(f);
    }
  }

  applyTorque(t: number): void {
    if (this.type === 'static') return;
    this.torque += t;
  }

  /**
   * Fundamental impulse equation:
   * delta_v = J / m
   * delta_omega = (r x J) / I
   */
  applyImpulse(impulse: Vec2, worldPoint: Vec2): void {
    if (this.type === 'static') return;
    this.velocity.addScaledMut(impulse, this.invMass);
    const r = worldPoint.sub(this.position);
    this.angularVelocity += this.invInertia * r.cross(impulse);
  }

  integrateVelocity(dt: number, gravity: Vec2, linearDamping = 0.999, angularDamping = 0.995): void {
    if (this.type === 'static') return;

    // Acceleration = (F / m) + g
    const a = this.force.scale(this.invMass).addMut(gravity);
    this.velocity.addScaledMut(a, dt);
    this.velocity.scaleMut(linearDamping);

    // Angular acceleration alpha = torque / I
    const alpha = this.torque * this.invInertia;
    this.angularVelocity += alpha * dt;
    this.angularVelocity *= angularDamping;

    // Reset force/torque accumulators
    this.force.set(0, 0);
    this.torque = 0;
  }

  integratePosition(dt: number): void {
    if (this.type === 'static') return;

    this.position.addScaledMut(this.velocity, dt);
    this.angle += this.angularVelocity * dt;
    this.updateTransform();
  }
}
