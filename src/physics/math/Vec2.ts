/**
 * Vec2 - High-performance 2D Vector mathematics built from first principles.
 * Core foundation of the VectorRigid physics engine.
 */
export class Vec2 {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // Factory helpers
  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  static fromAngle(rad: number, length = 1): Vec2 {
    return new Vec2(Math.cos(rad) * length, Math.sin(rad) * length);
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vec2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  // Arithmetic
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  addMut(v: Vec2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addScaled(v: Vec2, s: number): Vec2 {
    return new Vec2(this.x + v.x * s, this.y + v.y * s);
  }

  addScaledMut(v: Vec2, s: number): this {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  subMut(v: Vec2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  scaleMut(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  negate(): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  // Geometric products
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * 2D Cross product: a x b = ax * by - ay * bx
   * Returns signed scalar representing z-component of 3D cross product.
   */
  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * Cross product between scalar s (angular speed about z) and vector v:
   * s x v = (-s * vy, s * vx)
   */
  static crossScalarVector(s: number, v: Vec2): Vec2 {
    return new Vec2(-s * v.y, s * v.x);
  }

  /**
   * Cross product between vector v and scalar s (angular speed about z):
   * v x s = (s * vy, -s * vx)
   */
  static crossVectorScalar(v: Vec2, s: number): Vec2 {
    return new Vec2(s * v.y, -s * v.x);
  }

  // Magnitudes
  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  distanceSq(v: Vec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  distance(v: Vec2): number {
    return Math.sqrt(this.distanceSq(v));
  }

  normalize(): Vec2 {
    const len = this.length();
    if (len > 1e-9) {
      const inv = 1 / len;
      return new Vec2(this.x * inv, this.y * inv);
    }
    return new Vec2(0, 0);
  }

  normalizeMut(): this {
    const len = this.length();
    if (len > 1e-9) {
      const inv = 1 / len;
      this.x *= inv;
      this.y *= inv;
    } else {
      this.x = 0;
      this.y = 0;
    }
    return this;
  }

  /**
   * Counter-clockwise perpendicular vector (-y, x).
   */
  perp(): Vec2 {
    return new Vec2(-this.y, this.x);
  }

  /**
   * Clockwise perpendicular vector (y, -x).
   */
  perpCW(): Vec2 {
    return new Vec2(this.y, -this.x);
  }

  rotate(angleRad: number): Vec2 {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  project(onto: Vec2): Vec2 {
    const lenSq = onto.lengthSq();
    if (lenSq < 1e-9) return new Vec2(0, 0);
    const scale = this.dot(onto) / lenSq;
    return onto.scale(scale);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  lerp(target: Vec2, t: number): Vec2 {
    return new Vec2(this.x + (target.x - this.x) * t, this.y + (target.y - this.y) * t);
  }

  clamp(minLen: number, maxLen: number): Vec2 {
    const len = this.length();
    if (len < 1e-9) return new Vec2(0, 0);
    const clamped = Math.max(minLen, Math.min(maxLen, len));
    return this.scale(clamped / len);
  }

  toString(decimals = 2): string {
    return `(${this.x.toFixed(decimals)}, ${this.y.toFixed(decimals)})`;
  }
}
