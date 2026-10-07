import { Vec2 } from './Vec2';

/**
 * Mat2 - 2x2 Matrix for linear transformations, rotations, and constraint mass matrices.
 * Format:
 * [ m00, m01 ]
 * [ m10, m11 ]
 */
export class Mat2 {
  public m00: number;
  public m01: number;
  public m10: number;
  public m11: number;

  constructor(m00 = 1, m01 = 0, m10 = 0, m11 = 1) {
    this.m00 = m00;
    this.m01 = m01;
    this.m10 = m10;
    this.m11 = m11;
  }

  static identity(): Mat2 {
    return new Mat2(1, 0, 0, 1);
  }

  static fromAngle(radians: number): Mat2 {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return new Mat2(c, -s, s, c);
  }

  set(m00: number, m01: number, m10: number, m11: number): this {
    this.m00 = m00;
    this.m01 = m01;
    this.m10 = m10;
    this.m11 = m11;
    return this;
  }

  setFromAngle(radians: number): this {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    this.m00 = c;
    this.m01 = -s;
    this.m10 = s;
    this.m11 = c;
    return this;
  }

  multiplyVec(v: Vec2): Vec2 {
    return new Vec2(
      this.m00 * v.x + this.m01 * v.y,
      this.m10 * v.x + this.m11 * v.y
    );
  }

  multiply(b: Mat2): Mat2 {
    return new Mat2(
      this.m00 * b.m00 + this.m01 * b.m10,
      this.m00 * b.m01 + this.m01 * b.m11,
      this.m10 * b.m00 + this.m11 * b.m10,
      this.m10 * b.m01 + this.m11 * b.m11
    );
  }

  transpose(): Mat2 {
    return new Mat2(this.m00, this.m10, this.m01, this.m11);
  }

  determinant(): number {
    return this.m00 * this.m11 - this.m01 * this.m10;
  }

  invert(): Mat2 | null {
    const det = this.determinant();
    if (Math.abs(det) < 1e-12) return null;
    const invDet = 1 / det;
    return new Mat2(
      this.m11 * invDet,
      -this.m01 * invDet,
      -this.m10 * invDet,
      this.m00 * invDet
    );
  }

  /**
   * Solves A * x = b for x
   */
  solve(b: Vec2): Vec2 {
    const det = this.determinant();
    if (Math.abs(det) < 1e-12) return new Vec2(0, 0);
    const invDet = 1 / det;
    return new Vec2(
      (this.m11 * b.x - this.m01 * b.y) * invDet,
      (-this.m10 * b.x + this.m00 * b.y) * invDet
    );
  }
}
