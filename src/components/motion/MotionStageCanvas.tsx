import React, { useRef, useEffect } from 'react';
import { SCENES } from '../../animation/storyboardData';

interface MotionStageCanvasProps {
  currentTime: number; // in seconds (0 to 88)
  stopMotionBoilEnabled: boolean;
  onSelectScene?: (sceneIndex: number) => void;
}

export const MotionStageCanvas: React.FC<MotionStageCanvasProps> = ({
  currentTime,
  stopMotionBoilEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop motion boil tick
  const boilFrameRef = useRef<number>(0);
  const boilOffsetsRef = useRef<number[]>([]);

  useEffect(() => {
    // Generate 32 randomized boil offsets between -1.5 and 1.5 pixels
    boilOffsetsRef.current = Array.from({ length: 48 }, () => (Math.random() - 0.5) * 2.8);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const clientW = canvas.clientWidth;
    const clientH = canvas.clientHeight;

    if (canvas.width !== clientW * dpr || canvas.height !== clientH * dpr) {
      canvas.width = clientW * dpr;
      canvas.height = clientH * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Virtual coordinate space 1920x1080
    const vW = 1920;
    const vH = 1080;
    const scale = Math.min(clientW / vW, clientH / vH);
    const offsetX = (clientW - vW * scale) / 2;
    const offsetY = (clientH - vH * scale) / 2;

    // Clear with terminal background
    ctx.fillStyle = '#181b1e';
    ctx.fillRect(0, 0, clientW, clientH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Stop motion boil update (every 3 frames ~ 8fps boil rate)
    boilFrameRef.current++;
    if (stopMotionBoilEnabled && boilFrameRef.current % 3 === 0) {
      boilOffsetsRef.current = Array.from({ length: 48 }, () => (Math.random() - 0.5) * 2.8);
    }
    const b = (idx: number) => (stopMotionBoilEnabled ? (boilOffsetsRef.current[idx % 48] || 0) : 0);

    // Draw Miniature Paper Stage Background
    drawStageBackground(ctx, vW, vH, b);

    // Determine current scene progress
    const activeSceneIndex = SCENES.findIndex(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    const currentScene = SCENES[activeSceneIndex] || SCENES[SCENES.length - 1];
    const sceneElapsed = currentTime - currentScene.startTime;
    const sceneDuration = currentScene.endTime - currentScene.startTime;
    const sceneProgress = Math.max(0, Math.min(1, sceneElapsed / sceneDuration));

    // Render Scene specific visual story
    switch (currentScene.id) {
      case 1:
        renderScene1Hook(ctx, sceneProgress, currentTime, b);
        break;
      case 2:
        renderScene2FamiliarWorld(ctx, sceneProgress, currentTime, b);
        break;
      case 3:
        renderScene3Disruption(ctx, sceneProgress, currentTime, b);
        break;
      case 4:
        renderScene4Mechanism(ctx, sceneProgress, currentTime, b);
        break;
      case 5:
        renderScene5Discovery(ctx, sceneProgress, currentTime, b);
        break;
      case 6:
        renderScene6Consequence(ctx, sceneProgress, currentTime, b);
        break;
      case 7:
        renderScene7Recap(ctx, sceneProgress, currentTime, b);
        break;
    }

    // Stage border cutouts
    drawStageFrame(ctx, vW, vH);

    ctx.restore();
    ctx.restore();
  }, [currentTime, stopMotionBoilEnabled]);

  // Stage Background: warm cream paper with subtle grid and pencil marks
  const drawStageBackground = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    b: (i: number) => number
  ) => {
    // Drop shadow under miniature stage
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(80 + b(0), 60 + b(1), w - 160, h - 120);

    // Textured cream paper stage
    ctx.fillStyle = '#F7F4EB';
    ctx.fillRect(70, 50, w - 140, h - 100);

    // Subtle torn edge paper border
    ctx.strokeStyle = '#E5E0D0';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 50, w - 140, h - 100);

    // Grid notebook lines
    ctx.strokeStyle = 'rgba(46, 139, 133, 0.08)';
    ctx.lineWidth = 1;
    const gridStep = 60;
    ctx.beginPath();
    for (let x = 120; x < w - 120; x += gridStep) {
      ctx.moveTo(x + b(x % 10), 80);
      ctx.lineTo(x + b((x + 1) % 10), h - 80);
    }
    for (let y = 100; y < h - 80; y += gridStep) {
      ctx.moveTo(100, y + b(y % 10));
      ctx.lineTo(w - 100, y + b((y + 1) % 10));
    }
    ctx.stroke();

    // Subtle paper tape on top corners
    drawPaperTape(ctx, 90, 40, 100, 30, -0.15);
    drawPaperTape(ctx, w - 190, 40, 100, 30, 0.15);
  };

  const drawPaperTape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    rot: number
  ) => {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(235, 176, 54, 0.35)'; // Mustard masking tape
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = 'rgba(235, 176, 54, 0.5)';
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const drawStageFrame = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Outer dark terminal matte
    ctx.fillStyle = '#141618';
    ctx.fillRect(0, 0, w, 50);
    ctx.fillRect(0, h - 50, w, 50);
    ctx.fillRect(0, 0, 70, h);
    ctx.fillRect(w - 70, 0, 70, h);

    // Terminal top header bar
    ctx.fillStyle = '#202428';
    ctx.fillRect(70, 12, w - 140, 38);

    // Three stoplight terminal dots
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(100, 31, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(120, 31, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(140, 31, 6, 0, Math.PI * 2);
    ctx.fill();

    // Terminal title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('vectorrigid://first-principles-physics  [24 FPS • 1920x1080]', 175, 36);
  };

  // The Coral Pixel Mascot
  const drawMascot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    mood: 'curious' | 'shocked' | 'proud' | 'waving',
    b: (i: number) => number,
    time: number
  ) => {
    ctx.save();
    ctx.translate(x + b(0), y + b(1));
    ctx.scale(scale, scale);

    // Cardboard drop shadow
    ctx.fillStyle = 'rgba(35, 39, 42, 0.2)';
    ctx.fillRect(-22 + b(2), 26, 48, 12);

    // Body: square coral cutout with subtle texture
    ctx.fillStyle = '#F26A5A'; // Coral
    ctx.fillRect(-24, -24, 48, 48);

    // Inner paper highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(-22, -22, 44, 10);

    // Black eyes
    ctx.fillStyle = '#23272A'; // Charcoal
    const blink = Math.sin(time * 3) > 0.94;

    if (blink) {
      // Blinking slit
      ctx.fillRect(-14, -4, 8, 2);
      ctx.fillRect(6, -4, 8, 2);
    } else if (mood === 'shocked') {
      // Wide circular surprised eyes
      ctx.beginPath();
      ctx.arc(-10, -2, 5, 0, Math.PI * 2);
      ctx.arc(10, -2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (mood === 'curious') {
      // Inquisitive squint
      ctx.fillRect(-12, -4, 7, 7);
      ctx.fillRect(5, -6, 7, 7);
    } else {
      // Normal happy pixel dots
      ctx.fillRect(-12, -4, 6, 7);
      ctx.fillRect(6, -4, 6, 7);
    }

    // Little crayon smile/mouth
    if (mood === 'shocked') {
      ctx.fillStyle = '#23272A';
      ctx.fillRect(-4, 8, 8, 6);
    } else if (mood === 'curious') {
      ctx.strokeStyle = '#23272A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 7, 4, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#23272A';
      ctx.fillRect(-5, 9, 10, 3);
    }

    // Tiny cardboard legs
    ctx.fillStyle = '#D9534F';
    const legWobble = Math.sin(time * 8) * 4;
    ctx.fillRect(-16, 24, 8, 10 + (mood === 'waving' ? legWobble : 0));
    ctx.fillRect(8, 24, 8, 10 - (mood === 'waving' ? legWobble : 0));

    // Little waving hand
    if (mood === 'waving') {
      const armRot = Math.sin(time * 12) * 0.4 - 0.6;
      ctx.save();
      ctx.translate(24, 2);
      ctx.rotate(armRot);
      ctx.fillStyle = '#F26A5A';
      ctx.fillRect(0, -5, 18, 9);
      ctx.restore();
    }

    ctx.restore();
  };

  // Helper: Cardboard Box drawing
  const drawCardboardBox = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: string,
    angle: number,
    b: (i: number) => number,
    alpha = 1.0
  ) => {
    ctx.save();
    ctx.translate(cx + b(4), cy + b(5));
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    // Soft cardboard shadow
    ctx.fillStyle = 'rgba(35, 39, 42, 0.18)';
    ctx.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);

    // Box body
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Torn paper edge outline
    ctx.strokeStyle = 'rgba(35, 39, 42, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Box inner tape seam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  };

  // SCENE 1: HOOK (The Illusion of Solidity)
  const renderScene1Hook = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    // Ground platform (teal paper)
    drawCardboardBox(ctx, 960, 880, 1100, 60, '#2E8B85', 0, b);

    // Bottom Box (Mustard cardboard)
    const boxBottomY = 780;
    drawCardboardBox(ctx, 960, boxBottomY, 180, 140, '#EBB036', 0, b);

    // Top Box (Cream cardboard dropping & phasing through)
    // Starts high, drops down, phases right through bottom box
    const dropY = 320 + prog * 470;
    const isPhasing = dropY > boxBottomY - 140;
    const topAlpha = isPhasing ? 0.55 + Math.sin(time * 10) * 0.15 : 1.0;
    drawCardboardBox(ctx, 960, dropY, 180, 140, '#F7F4EB', Math.sin(time * 2) * 0.04, b, topAlpha);

    // Overlapping ghost area callout
    if (isPhasing) {
      ctx.strokeStyle = '#F26A5A';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(960 - 80, boxBottomY - 60, 160, 100);
      ctx.setLineDash([]);

      ctx.fillStyle = '#F26A5A';
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillText('NO COLLISION DETECTED', 1080, boxBottomY - 15);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText('Empty Memory (Numbers Passing Through Numbers)', 1080, boxBottomY + 12);
    }

    // Coral Mascot gasping
    const mascotX = 640 + prog * 40;
    drawMascot(ctx, mascotX, 780, 1.4, isPhasing ? 'shocked' : 'curious', b, time);

    // Chalk title
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('1. The Illusion of Solidity', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Why don’t video game objects simply fall through each other?', 220, 210);
  };

  // SCENE 2: FAMILIAR WORLD (The Lone Vector)
  const renderScene2FamiliarWorld = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    // Bedrock
    drawCardboardBox(ctx, 960, 880, 1100, 60, '#2E8B85', 0, b);

    // Falling Particle with growing velocity vector
    const particleY = 280 + Math.pow(prog, 1.8) * 440;
    const arrowLen = 60 + prog * 160;

    // Crayon trailing dots
    ctx.fillStyle = 'rgba(235, 176, 54, 0.7)';
    for (let i = 0; i < 6; i++) {
      const dotY = 280 + i * (particleY - 280) / 6;
      ctx.beginPath();
      ctx.arc(960 + b(i), dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particle disk
    ctx.fillStyle = '#F7F4EB';
    ctx.beginPath();
    ctx.arc(960, particleY, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#23272A';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Growing velocity vector arrow (Coral)
    ctx.strokeStyle = '#F26A5A';
    ctx.fillStyle = '#F26A5A';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(960, particleY);
    ctx.lineTo(960, particleY + arrowLen);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(960, particleY + arrowLen + 15);
    ctx.lineTo(948, particleY + arrowLen);
    ctx.lineTo(972, particleY + arrowLen);
    ctx.closePath();
    ctx.fill();

    // Vector formula callout
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('v(t+Δt) = v(t) + g·Δt', 1010, particleY + arrowLen * 0.5);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('p(t+Δt) = p(t) + v·Δt', 1010, particleY + arrowLen * 0.5 + 26);

    // Mascot observing
    drawMascot(ctx, 740, 780, 1.3, 'curious', b, time);

    // Scene Header
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('2. The Lone Vector', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Position steps forward by velocity. Gravity lengthens the arrow.', 220, 210);
  };

  // SCENE 3: DISRUPTION (The Collision Catastrophe)
  const renderScene3Disruption = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    drawCardboardBox(ctx, 960, 880, 1100, 60, '#2E8B85', 0, b);

    // Two boxes with chaotic vibrating spring between them
    const boxLeftX = 780;
    const boxRightX = 1140;
    const boxY = 660;

    // Vibrating chaos
    const springJitter = Math.sin(time * 35) * (prog * 24);
    const boxLaunchY = boxY - Math.max(0, (prog - 0.6) * 600);

    drawCardboardBox(ctx, boxLeftX, boxY, 150, 120, '#EBB036', 0, b);
    drawCardboardBox(
      ctx,
      boxRightX + springJitter,
      boxLaunchY,
      150,
      120,
      '#F7F4EB',
      prog * 1.8,
      b
    );

    // Coiled crimson spring
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(boxLeftX + 75, boxY);
    const coils = 12;
    for (let c = 1; c < coils; c++) {
      const tx = (boxLeftX + 75) + (c / coils) * (boxRightX - 75 - (boxLeftX + 75));
      const ty = boxY + (c % 2 === 0 ? 1 : -1) * (20 + springJitter);
      ctx.lineTo(tx, ty);
    }
    ctx.lineTo(boxRightX - 75 + springJitter, boxLaunchY);
    ctx.stroke();

    // Chaotic explosion lines
    if (prog > 0.4) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) {
        const ang = k * (Math.PI / 4) + time * 4;
        ctx.beginPath();
        ctx.moveTo(960, boxY);
        ctx.lineTo(960 + Math.cos(ang) * 90, boxY + Math.sin(ang) * 90);
        ctx.stroke();
      }

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('PENALTY SPRINGS EXPLODE!', 760, 420);
      ctx.fillStyle = '#64748b';
      ctx.font = '16px "JetBrains Mono", monospace';
      ctx.fillText('Accumulated artificial energy destroys numerical stability', 720, 455);
    }

    // Mascot terrified shielding eyes
    drawMascot(ctx, 480, 780, 1.4, 'shocked', b, time);

    // Scene Header
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('3. The Collision Catastrophe', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Faking solidity with springs adds false energy. The universe explodes.', 220, 210);
  };

  // SCENE 4: MECHANISM (The Secret of the Impulse)
  const renderScene4Mechanism = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    // Zoomed in contact boundary between Box A and Box B
    // Left Box A face
    ctx.fillStyle = '#EBB036';
    ctx.fillRect(360, 360, 360, 420);
    ctx.strokeStyle = '#23272A';
    ctx.lineWidth = 3;
    ctx.strokeRect(360, 360, 360, 420);

    // Right Box B face
    ctx.fillStyle = '#2E8B85';
    ctx.fillRect(725, 360, 360, 420);
    ctx.strokeStyle = '#23272A';
    ctx.lineWidth = 3;
    ctx.strokeRect(725, 360, 360, 420);

    // Micro contact interface (x = 722)
    const contactX = 722;
    const contactY = 570;

    // Contact Normal vector n (Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(contactX, contactY);
    ctx.lineTo(contactX + 160, contactY);
    ctx.stroke();
    ctx.fillText('n̂ (Normal)', contactX + 175, contactY + 6);

    // Contact Tangent vector t (Emerald)
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(contactX, contactY);
    ctx.lineTo(contactX, contactY - 140);
    ctx.stroke();
    ctx.fillText('t̂ (Friction)', contactX + 10, contactY - 150);

    // Impulse Pulse (Golden wave)
    const pulseLen = Math.sin(time * 8) * 40 + 80;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(contactX - pulseLen * 0.5, contactY);
    ctx.lineTo(contactX + pulseLen * 0.5, contactY);
    ctx.stroke();

    // Mathematical breakdown card
    ctx.fillStyle = '#F7F4EB';
    ctx.fillRect(1220, 340, 520, 440);
    ctx.strokeStyle = '#23272A';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1220, 340, 520, 440);

    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('SEQUENTIAL IMPULSE (Box2D)', 1250, 390);

    ctx.fillStyle = '#06b6d4';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillText('v_rel·n = 0   (Non-Penetration)', 1250, 440);

    ctx.fillStyle = '#23272A';
    ctx.fillText('Effective Mass:', 1250, 490);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('m_eff = 1 / (1/m1 + 1/m2 + (r×n)²/I)', 1250, 520);

    ctx.fillStyle = '#23272A';
    ctx.fillText('Impulse Delta:', 1250, 570);
    ctx.fillStyle = '#F26A5A';
    ctx.fillText('Δλ = -m_eff · (v_rel·n + bias)', 1250, 600);

    ctx.fillStyle = '#10b981';
    ctx.fillText('Coulomb Friction: |λ_t| ≤ μ·λ_n', 1250, 660);

    // Mascot operating impulse lever
    drawMascot(ctx, 280, 650, 1.4, 'proud', b, time);

    // Scene Header
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('4. The Secret of the Impulse', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Instantaneous velocity correction: stop penetration with zero added energy.', 220, 210);
  };

  // SCENE 5: DISCOVERY (Warm Starting & Memory)
  const renderScene5Discovery = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    // Bedrock
    drawCardboardBox(ctx, 960, 880, 1100, 60, '#2E8B85', 0, b);

    // 21 Boxes Pyramid!
    const tiers = 6;
    const boxW = 60;
    const boxH = 48;
    const startX = 960;
    const groundY = 825;

    const colors = ['#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#f472b6'];

    // Warm starting toggle switch visualization
    const isWarm = prog > 0.35;

    let bIdx = 0;
    for (let t = 0; t < tiers; t++) {
      const count = tiers - t;
      const tY = groundY - t * boxH;
      const tStartX = startX - ((count - 1) * boxW) / 2;

      for (let i = 0; i < count; i++) {
        const bx = tStartX + i * boxW;
        // Without warm starting: slight jitter / sink
        const jitter = isWarm ? 0 : Math.sin(time * 20 + bIdx) * 2.5;
        drawCardboardBox(ctx, bx, tY + jitter, boxW - 4, boxH - 4, colors[t % colors.length], 0, b);

        // Golden warm start impulse glow
        if (isWarm) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(bx, tY + boxH * 0.45, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        bIdx++;
      }
    }

    // Indicator Badge
    ctx.fillStyle = isWarm ? '#10b981' : '#f43f5e';
    ctx.fillRect(1320, 360, 340, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText(isWarm ? 'WARM STARTING: ACTIVE' : 'COLD START: OFF', 1345, 400);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(isWarm ? 'Previous Frame λ Re-injected' : 'Chatter & Sagging Stack', 1345, 430);

    // Mascot walking up pyramid stairs
    const mascotStep = Math.min(5, Math.floor(prog * 7));
    const mX = 720 + mascotStep * 30;
    const mY = groundY - mascotStep * boxH - 24;
    drawMascot(ctx, mX, mY, 1.2, 'waving', b, time);

    // Scene Header
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('5. Warm Starting & Memory', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('By re-injecting previous frame impulses, the pyramid stands rock-solid.', 220, 210);
  };

  // SCENE 6: CONSEQUENCE (The Grand Wrecking Ball)
  const renderScene6Consequence = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    // Bedrock
    drawCardboardBox(ctx, 960, 880, 1100, 60, '#2E8B85', 0, b);

    // Wrecking ball swing arc
    // Angle swings from -1.1 rad down to +0.8 rad
    const swingAngle = -1.1 + prog * 1.9;
    const gantryX = 540;
    const gantryY = 180;
    const chainLen = 380;

    const ballX = gantryX + Math.sin(swingAngle) * chainLen;
    const ballY = gantryY + Math.cos(swingAngle) * chainLen;

    // Revolute Chain links
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(gantryX, gantryY);
    ctx.lineTo(ballX, ballY);
    ctx.stroke();

    // 5 Joint Pin Rivets
    for (let j = 1; j <= 5; j++) {
      const frac = j / 5;
      const jx = gantryX + (ballX - gantryX) * frac;
      const jy = gantryY + (ballY - gantryY) * frac;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(jx, jy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy glowing amber wrecking ball
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#23272A';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Shattered pyramid boxes scattering realistically
    const impactProg = Math.max(0, (prog - 0.45) * 2.2);
    const tiers = 5;
    const colors = ['#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc'];

    for (let t = 0; t < tiers; t++) {
      const count = tiers - t;
      const tY = 820 - t * 45;
      for (let i = 0; i < count; i++) {
        const origX = 960 - ((count - 1) * 60) / 2 + i * 60;
        const scatterX = origX + impactProg * (i * 50 + 80);
        const scatterY = tY - impactProg * (40 - i * 15) + impactProg * impactProg * 280;
        const scatterRot = impactProg * (i * 0.8 + 0.4);

        drawCardboardBox(ctx, scatterX, scatterY, 54, 42, colors[t], scatterRot, b);
      }
    }

    // Mascot riding atop wrecking ball!
    drawMascot(ctx, ballX, ballY - 60, 1.2, 'waving', b, time);

    // Scene Header
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('6. The Grand Wrecking Ball', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Revolute joints transfer kinetic momentum. Every contact resolves honestly.', 220, 210);
  };

  // SCENE 7: RECAP (From Pure Math to Worlds)
  const renderScene7Recap = (
    ctx: CanvasRenderingContext2D,
    prog: number,
    time: number,
    b: (i: number) => number
  ) => {
    // 6-layer constellation diagram revolving around mascot
    const centerX = 960;
    const centerY = 540;
    const radius = 260;

    const layers = [
      { name: 'Layer 0: Vectors', color: '#F26A5A' },
      { name: 'Layer 1: Integrator', color: '#EBB036' },
      { name: 'Layer 2: Rods & Cables', color: '#2E8B85' },
      { name: 'Layer 3: Rigid Bodies', color: '#6366f1' },
      { name: 'Layer 4: SAT Collisions', color: '#ec4899' },
      { name: 'Layer 5: Impulses', color: '#06b6d4' },
      { name: 'Layer 6: Joints', color: '#f59e0b' },
    ];

    // Connecting golden lines
    ctx.strokeStyle = 'rgba(235, 176, 54, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < layers.length; i++) {
      const angle = (i / layers.length) * Math.PI * 2 + time * 0.2;
      const lx = centerX + Math.cos(angle) * radius;
      const ly = centerY + Math.sin(angle) * radius;
      ctx.lineTo(lx, ly);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Layer nodes
    for (let i = 0; i < layers.length; i++) {
      const angle = (i / layers.length) * Math.PI * 2 + time * 0.2;
      const lx = centerX + Math.cos(angle) * radius;
      const ly = centerY + Math.sin(angle) * radius;

      // Cardboard node
      drawCardboardBox(ctx, lx, ly, 150, 48, layers[i].color, 0, b);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(layers[i].name, lx, ly + 4);
      ctx.textAlign = 'left';
    }

    // Center Mascot holding golden vector spark
    drawMascot(ctx, centerX, centerY + 10, 1.6, 'proud', b, time);

    // Glowing spark
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX + 35, centerY - 15, 8 + Math.sin(time * 10) * 3, 0, Math.PI * 2);
    ctx.fill();

    // Scene Header
    ctx.fillStyle = '#23272A';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('7. From Pure Math to Worlds', 220, 170);
    ctx.font = '20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('You didn’t fake physics with sticks. You proved it from first principles.', 220, 210);
  };

  return (
    <div className="relative w-full h-full bg-[#181b1e] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
