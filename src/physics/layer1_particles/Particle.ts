import { Vec2 } from '../math/Vec2';

export type IntegratorType = 'explicit_euler' | 'semi_implicit_euler' | 'verlet';

export class Particle {
  public id: string;
  public position: Vec2;
  public prevPosition: Vec2; // for Verlet
  public velocity: Vec2;
  public acceleration: Vec2;
  public force: Vec2;
  public mass: number;
  public invMass: number;
  public radius: number;
  public color: string;
  public isFixed: boolean;
  public integratorType: IntegratorType = 'semi_implicit_euler';
  public label?: string;
  public trail: Vec2[] = [];

  constructor(
    x: number,
    y: number,
    mass = 1.0,
    radius = 6,
    color = '#38bdf8',
    isFixed = false,
    integratorType: IntegratorType = 'semi_implicit_euler',
    label?: string
  ) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.position = new Vec2(x, y);
    this.prevPosition = new Vec2(x, y);
    this.velocity = new Vec2(0, 0);
    this.acceleration = new Vec2(0, 0);
    this.force = new Vec2(0, 0);
    this.mass = isFixed ? Infinity : Math.max(1e-6, mass);
    this.invMass = isFixed ? 0 : 1 / this.mass;
    this.radius = radius;
    this.color = color;
    this.isFixed = isFixed;
    this.integratorType = integratorType;
    this.label = label;
  }

  applyForce(f: Vec2): void {
    if (this.isFixed) return;
    this.force.addMut(f);
  }

  clearForces(): void {
    this.force.set(0, 0);
  }

  /**
   * Integrate particle according to chosen mathematical scheme.
   */
  integrate(dt: number, overrideType?: IntegratorType): void {
    if (this.isFixed || dt <= 0) return;

    const type = overrideType || this.integratorType;

    // Acceleration a = F / m
    const a = this.force.scale(this.invMass);
    this.acceleration.copy(a);

    switch (type) {
      case 'explicit_euler':
        // x_{t+dt} = x_t + v_t * dt
        // v_{t+dt} = v_t + a_t * dt
        this.position.addScaledMut(this.velocity, dt);
        this.velocity.addScaledMut(a, dt);
        break;

      case 'semi_implicit_euler':
        // v_{t+dt} = v_t + a_t * dt (update velocity first)
        // x_{t+dt} = x_t + v_{t+dt} * dt (use newly updated velocity for position)
        this.velocity.addScaledMut(a, dt);
        this.position.addScaledMut(this.velocity, dt);
        break;

      case 'verlet': {
        // x_{t+dt} = 2*x_t - x_{t-dt} + a_t * dt^2
        const temp = this.position.clone();
        const diff = this.position.sub(this.prevPosition);
        this.position.addMut(diff).addScaledMut(a, dt * dt);
        this.prevPosition.copy(temp);
        this.velocity = diff.scale(1 / dt);
        break;
      }
    }

    // Keep recent trail for orbits / paths visualization
    this.trail.push(this.position.clone());
    if (this.trail.length > 80) {
      this.trail.shift();
    }
  }

  getKineticEnergy(): number {
    return 0.5 * this.mass * this.velocity.lengthSq();
  }
}
