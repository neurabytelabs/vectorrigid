import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Vec2 } from '../physics/math/Vec2';
import { Body } from '../physics/layer3_rigidbody/Body';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { ContactPoint } from '../physics/layer4_collision/Collision';
import { InspectedContactData, extractContactTelemetry } from '../physics/inspector/ContactTelemetry';

interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

interface PhysicsCanvasProps {
  world: PhysicsWorld;
  wreckingBall: Body | null;
  isRunning: boolean;
  onStepTick: () => void;
  selectedContact: InspectedContactData | null;
  onSelectContact: (data: InspectedContactData | null) => void;
  showVectors: boolean;
  showNormals: boolean;
  showImpulses: boolean;
  showLeverArms: boolean;
  showVelocities: boolean;
  showAABBs: boolean;
  onResetZoom: () => void;
  focalPoint?: Vec2;
  defaultZoom?: number;
}

export const PhysicsCanvas: React.FC<PhysicsCanvasProps> = ({
  world,
  wreckingBall,
  isRunning,
  onStepTick,
  selectedContact,
  onSelectContact,
  showVectors,
  showNormals,
  showImpulses,
  showLeverArms,
  showVelocities,
  showAABBs,
  onResetZoom,
  focalPoint,
  defaultZoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera state
  const cameraRef = useRef<Camera>({
    x: 650,
    y: 420,
    zoom: 1.0,
    targetX: 650,
    targetY: 420,
    targetZoom: 1.0,
  });

  // Track target focalPoint and defaultZoom on preset changes
  useEffect(() => {
    if (focalPoint) {
      cameraRef.current.targetX = focalPoint.x;
      cameraRef.current.targetY = focalPoint.y;
    }
    if (defaultZoom) {
      cameraRef.current.targetZoom = defaultZoom;
    }
  }, [focalPoint, defaultZoom]);

  // Keep live refs to avoid tearing down the requestAnimationFrame loop
  const selectedContactRef = useRef<InspectedContactData | null>(selectedContact);
  selectedContactRef.current = selectedContact;
  const onSelectContactRef = useRef(onSelectContact);
  onSelectContactRef.current = onSelectContact;
  const onStepTickRef = useRef(onStepTick);
  onStepTickRef.current = onStepTick;
  const lastTelemetryUpdate = useRef<number>(0);

  // Dragging state (supports wrecking ball slingshot or any dynamic body)
  const [isDragging, setIsDragging] = useState(false);
  const draggedBodyRef = useRef<Body | null>(null);
  const dragStartRef = useRef<Vec2 | null>(null);
  const dragCurrentRef = useRef<Vec2 | null>(null);

  // Pan state
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; camX: number; camY: number }>({
    mouseX: 0,
    mouseY: 0,
    camX: 0,
    camY: 0,
  });

  // Smooth camera zoom animation to contact
  const zoomToContact = useCallback((cp: ContactPoint) => {
    cameraRef.current.targetX = cp.position.x;
    cameraRef.current.targetY = cp.position.y;
    cameraRef.current.targetZoom = 4.2; // deep vector inspection zoom
  }, []);

  // Screen <-> World coordinate transforms
  const screenToWorld = useCallback((screenX: number, screenY: number, canvas: HTMLCanvasElement): Vec2 => {
    const cam = cameraRef.current;
    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);
    const wx = (screenX - cw / 2) / cam.zoom + cam.x;
    const wy = (screenY - ch / 2) / cam.zoom + cam.y;
    return new Vec2(wx, wy);
  }, []);

  // Animation & simulation loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      // Smooth camera interpolation
      const cam = cameraRef.current;
      cam.x += (cam.targetX - cam.x) * 0.12;
      cam.y += (cam.targetY - cam.y) * 0.12;
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.12;

      // Physics step if running
      if (isRunning) {
        world.step(1 / 60);
        onStepTickRef.current();
      }

      // Refresh selected contact telemetry in real-time
      if (selectedContactRef.current) {
        const sc = selectedContactRef.current;
        let stillFound = false;
        for (const m of world.manifolds) {
          for (const cp of m.contacts) {
            if (
              (m.bodyA.id === sc.bodyA.id && m.bodyB.id === sc.bodyB.id) ||
              (m.bodyA.id === sc.bodyB.id && m.bodyB.id === sc.bodyA.id)
            ) {
              const updated = extractContactTelemetry(m, cp, 1 / 60);
              selectedContactRef.current = updated;
              // Throttle React state update so React doesn't re-render 60 times a second
              if (time - lastTelemetryUpdate.current > 120) {
                onSelectContactRef.current(updated);
                lastTelemetryUpdate.current = time;
              }
              stillFound = true;
              break;
            }
          }
          if (stillFound) break;
        }
      }

      // Draw frame
      drawCanvas();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, world]);

  // Main Canvas Render
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Apply Camera Transform
    const cam = cameraRef.current;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // Grid lines (subtle blueprint background)
    drawBlueprintGrid(ctx, cam, w, h);

    // 1. Draw Particle Constraints (Layer 2: Rods, Cables, Springs)
    drawConstraints(ctx);

    // 2. Draw Particles (Layer 1: Integrator trails & bodies)
    drawParticles(ctx);

    // 3. Draw Chains & Revolute Joints (Layer 6)
    drawJoints(ctx);

    // 4. Draw Rigid Bodies (Layer 3)
    for (const body of world.bodies) {
      drawBody(ctx, body);
    }

    // 5. Draw Slingshot Drag Vector if active
    if (isDragging && dragStartRef.current && dragCurrentRef.current && draggedBodyRef.current) {
      drawSlingshot(ctx, draggedBodyRef.current.position, dragCurrentRef.current);
    }

    // 6. Draw Vector Overlays (Contacts, Normals, Impulses, Lever Arms)
    drawManifoldsAndVectors(ctx);

    // 7. Draw Selected Contact Highlight
    if (selectedContactRef.current) {
      drawSelectedContactVectors(ctx, selectedContactRef.current);
    }

    ctx.restore();

    // Canvas HUD overlay (Scale ruler & Camera Zoom Indicator)
    drawHUD(ctx, w, h, cam.zoom);

    ctx.restore();
  };

  // Blueprint Grid
  const drawBlueprintGrid = (
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    viewW: number,
    viewH: number
  ) => {
    const step = 80;
    const startX = Math.floor((cam.x - viewW / cam.zoom / 2) / step) * step;
    const endX = Math.ceil((cam.x + viewW / cam.zoom / 2) / step) * step;
    const startY = Math.floor((cam.y - viewH / cam.zoom / 2) / step) * step;
    const endY = Math.ceil((cam.y + viewH / cam.zoom / 2) / step) * step;

    ctx.lineWidth = 1 / cam.zoom;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  };

  // Constraints Rendering (Rods, Cables, Springs)
  const drawConstraints = (ctx: CanvasRenderingContext2D) => {
    for (const c of world.constraints) {
      const p1 = c.p1.position;
      const p2 = c.p2.position;

      ctx.save();
      if (c.type === 'rod') {
        // Rigid Rod (cyan metallic truss)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Pin ends
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.type === 'cable') {
        // Unilateral Cable (amber when taut, dashed gray when slack!)
        const dist = p1.distance(p2);
        const isSlack = dist < c.length - 2;

        ctx.strokeStyle = isSlack ? '#64748b' : '#f59e0b';
        ctx.lineWidth = isSlack ? 2 : 3;
        if (isSlack) {
          ctx.setLineDash([4, 4]);
        }
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (c.type === 'spring') {
        // Damped Spring (pink zigzag coil)
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        const diff = p2.sub(p1);
        const len = diff.length();
        if (len > 1e-4) {
          const perp = new Vec2(-diff.y, diff.x).normalize();
          const coils = 8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          for (let i = 1; i < coils; i++) {
            const t = i / coils;
            const side = (i % 2 === 0 ? 1 : -1) * 8;
            const pt = p1.lerp(p2, t).addScaled(perp, side);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };

  // Particles Rendering (Layer 1)
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (const p of world.particles) {
      // Trail
      if (p.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Particle body
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = p.isFixed ? 2 : 1;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label
      if (p.label) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(p.label, p.position.x + p.radius + 6, p.position.y + 4);
      }
      ctx.restore();
    }
  };

  // Joints Rendering (Layer 6)
  const drawJoints = (ctx: CanvasRenderingContext2D) => {
    for (const joint of world.joints) {
      const pA = joint.getWorldAnchorA();
      const pB = joint.getWorldAnchorB();

      // Chain connection line
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();

      // Pin rivet
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pA.x, pA.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  // Body Rendering
  const drawBody = (ctx: CanvasRenderingContext2D, body: Body) => {
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const isSelected =
      selectedContactRef.current &&
      (selectedContactRef.current.bodyA.id === body.id || selectedContactRef.current.bodyB.id === body.id);

    if (body.shapeType === 'circle') {
      // Circle / Wrecking Ball
      const grad = ctx.createRadialGradient(-body.radius * 0.3, -body.radius * 0.3, 2, 0, 0, body.radius);
      if (body.color === '#f59e0b') {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#f59e0b');
        grad.addColorStop(1, '#78350f');
      } else {
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(0.5, body.color);
        grad.addColorStop(1, '#0f172a');
      }

      ctx.fillStyle = grad;
      ctx.strokeStyle = isSelected ? '#38bdf8' : body.strokeColor || '#94a3b8';
      ctx.lineWidth = isSelected ? 3 : 1.5;

      ctx.beginPath();
      ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orientation line to show spin
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(body.radius * 0.85, 0);
      ctx.stroke();
    } else {
      // Box / Pyramid Brick
      const hw = body.halfWidth;
      const hh = body.halfHeight;

      if (body.type === 'static') {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
        ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
      } else {
        // Dynamic box
        ctx.fillStyle = body.color;
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#0f172a';
        ctx.lineWidth = isSelected ? 2.5 : 1.2;

        ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
        ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);

        // Center dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // AABB Debug
    if (showAABBs && body.type !== 'static') {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1;
      const aw = body.aabb.max.x - body.aabb.min.x;
      const ah = body.aabb.max.y - body.aabb.min.y;
      ctx.strokeRect(body.aabb.min.x, body.aabb.min.y, aw, ah);
    }

    // Velocity Vector
    if (showVelocities && body.type !== 'static') {
      const vLen = body.velocity.length();
      if (vLen > 5) {
        const velEnd = body.position.addScaled(body.velocity, 0.08);
        drawArrow(ctx, body.position, velEnd, '#10b981', 1.5, 'v');
      }
    }
  };

  // Slingshot vector preview
  const drawSlingshot = (ctx: CanvasRenderingContext2D, ballPos: Vec2, dragPos: Vec2) => {
    // Pull line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ballPos.x, ballPos.y);
    ctx.lineTo(dragPos.x, dragPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trajectory impulse arrow (showing direction of release fling)
    const impulse = dragStartRef.current ? dragCurrentRef.current?.sub(dragStartRef.current).scale(2.5) : null;
    if (impulse && impulse.length() > 5) {
      const impulseEnd = ballPos.add(impulse);
      drawArrow(ctx, ballPos, impulseEnd, '#f59e0b', 3, 'Fling');
    }
  };

  // Draw Contact Manifolds & Vectors
  const drawManifoldsAndVectors = (ctx: CanvasRenderingContext2D) => {
    if (!showVectors) return;

    for (const manifold of world.manifolds) {
      for (const cp of manifold.contacts) {
        const isThisSelected =
          selectedContactRef.current &&
          selectedContactRef.current.worldPos.distanceSq(cp.position) < 4;

        // Contact point marker
        ctx.fillStyle = isThisSelected ? '#f43f5e' : '#fb7185';
        ctx.beginPath();
        ctx.arc(cp.position.x, cp.position.y, isThisSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Contact Normal (Cyan)
        if (showNormals) {
          const normalEnd = cp.position.addScaled(cp.normal, 18);
          drawArrow(ctx, cp.position, normalEnd, '#06b6d4', 1.5);
        }

        // Impulse vector (Amber)
        if (showImpulses && cp.normalImpulse > 0.01) {
          const impulseVec = cp.normal.scale(cp.normalImpulse * 0.04);
          const impulseEnd = cp.position.add(impulseVec);
          drawArrow(ctx, cp.position, impulseEnd, '#f59e0b', 2.0);
        }

        // Lever arms (rA and rB)
        if (showLeverArms) {
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);

          ctx.beginPath();
          ctx.moveTo(manifold.bodyA.position.x, manifold.bodyA.position.y);
          ctx.lineTo(cp.position.x, cp.position.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(manifold.bodyB.position.x, manifold.bodyB.position.y);
          ctx.lineTo(cp.position.x, cp.position.y);
          ctx.stroke();

          ctx.setLineDash([]);
        }
      }
    }
  };

  // High-Precision Deep Zoom Vector Inspection Overlay
  const drawSelectedContactVectors = (ctx: CanvasRenderingContext2D, sc: InspectedContactData) => {
    const cp = sc.worldPos;

    // Outer radar ring
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    // 1. Normal Vector n (Cyan)
    const nEnd = cp.addScaled(sc.normal, 35);
    drawArrow(ctx, cp, nEnd, '#22d3ee', 2.5, 'n');

    // 2. Tangent Vector t (Emerald)
    const tEnd = cp.addScaled(sc.tangent, 35);
    drawArrow(ctx, cp, tEnd, '#10b981', 2.5, 't');

    // 3. Normal Impulse Vector Pn (Amber)
    if (sc.accumulatedNormalImpulse > 0.01) {
      const pScale = Math.min(80, Math.max(15, sc.accumulatedNormalImpulse * 0.08));
      const pEnd = cp.addScaled(sc.normal, pScale);
      drawArrow(ctx, cp, pEnd, '#f59e0b', 3.5, `Pn (${sc.accumulatedNormalImpulse.toFixed(1)})`);
    }

    // 4. Lever arm rA (Purple)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sc.bodyA.position.x, sc.bodyA.position.y);
    ctx.lineTo(cp.x, cp.y);
    ctx.stroke();

    // 5. Lever arm rB (Pink)
    ctx.strokeStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(sc.bodyB.position.x, sc.bodyB.position.y);
    ctx.lineTo(cp.x, cp.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // HUD Overlay
  const drawHUD = (ctx: CanvasRenderingContext2D, w: number, h: number, zoom: number) => {
    // Bottom-left zoom & scale metadata
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 1;
    ctx.fillRect(16, h - 54, 180, 38);
    ctx.strokeRect(16, h - 54, 180, 38);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`ZOOM: ${(zoom * 100).toFixed(0)}%`, 26, h - 34);
    ctx.fillText(`SCALE: 1m ≈ 100px`, 26, h - 20);

    // Top-right instruction hint
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Click contact to inspect | Drag ball to swing | Scroll to zoom', w - 16, 24);
    ctx.textAlign = 'left';
  };

  // Utility Arrow Drawing
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    from: Vec2,
    to: Vec2,
    color: string,
    width: number,
    label?: string
  ) => {
    const diff = to.sub(from);
    const len = diff.length();
    if (len < 1e-4) return;

    const angle = diff.angle();
    const headLen = Math.min(len * 0.4, 8);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLen * Math.cos(angle - Math.PI / 6),
      to.y - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - headLen * Math.cos(angle + Math.PI / 6),
      to.y - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    // Text Label
    if (label) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(label, to.x + 6, to.y - 4);
    }
  };

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY, canvas);

    // 1. Check if user clicked on wrecking ball or dynamic body to drag/throw
    let clickedBody: Body | null = null;
    if (wreckingBall && worldPos.distance(wreckingBall.position) < wreckingBall.radius * 1.5) {
      clickedBody = wreckingBall;
    } else {
      for (const b of world.bodies) {
        if (
          b.type !== 'static' &&
          b.aabb.min.x <= worldPos.x &&
          worldPos.x <= b.aabb.max.x &&
          b.aabb.min.y <= worldPos.y &&
          worldPos.y <= b.aabb.max.y
        ) {
          clickedBody = b;
          break;
        }
      }
    }

    if (clickedBody) {
      draggedBodyRef.current = clickedBody;
      dragStartRef.current = worldPos.clone();
      dragCurrentRef.current = worldPos.clone();
      setIsDragging(true);
      return;
    }

    // 2. Check if user clicked on a contact point to inspect vectors
    const nearest = world.findNearestContact(worldPos, 28 / cameraRef.current.zoom);
    if (nearest) {
      const telemetry = extractContactTelemetry(nearest.manifold, nearest.contact, 1 / 60);
      onSelectContact(telemetry);
      zoomToContact(nearest.contact);
      return;
    }

    // 3. Otherwise start canvas pan
    isPanningRef.current = true;
    panStartRef.current = {
      mouseX,
      mouseY,
      camX: cameraRef.current.x,
      camY: cameraRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && draggedBodyRef.current) {
      const currentWorld = screenToWorld(mouseX, mouseY, canvas);
      dragCurrentRef.current = currentWorld;
      // Guide the body towards the cursor while dragging
      draggedBodyRef.current.position.set(currentWorld.x, currentWorld.y);
      draggedBodyRef.current.velocity.set(0, 0);
    } else if (isPanningRef.current) {
      const dx = (mouseX - panStartRef.current.mouseX) / cameraRef.current.zoom;
      const dy = (mouseY - panStartRef.current.mouseY) / cameraRef.current.zoom;
      cameraRef.current.targetX = panStartRef.current.camX - dx;
      cameraRef.current.targetY = panStartRef.current.camY - dy;
      cameraRef.current.x = cameraRef.current.targetX;
      cameraRef.current.y = cameraRef.current.targetY;
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedBodyRef.current && dragStartRef.current && dragCurrentRef.current) {
      // Release with fling impulse
      const impulseVector = dragCurrentRef.current.sub(dragStartRef.current).scale(3.5);
      draggedBodyRef.current.velocity.set(impulseVector.x * 2.5, impulseVector.y * 2.5);
      setIsDragging(false);
      draggedBodyRef.current = null;
      dragStartRef.current = null;
      dragCurrentRef.current = null;
    }
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.4, Math.min(10.0, cameraRef.current.targetZoom * zoomFactor));
    cameraRef.current.targetZoom = newZoom;
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};
