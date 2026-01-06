'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type MouseEvent,
} from 'react';
import * as THREE from 'three';
import Sprite from './Sprite';

const BASE_RADIUS = 1800; // world-space ground disk radius
const CANVAS_W = 600;
const CANVAS_H = 800;

const WALK_SPEED = 250;
const WALK_FREQUENCY = 6.0;
const ARRIVAL_RADIUS = 100;
const MAX_TURN_SPEED = Math.PI; // radians per second

type Mode = 'walk' | 'sit' | 'idle';

const makeVec3 = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, y, z);

const randBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const wrapAngle = (a: number) => {
  const twoPi = Math.PI * 2;
  a = a % twoPi;
  if (a < 0) a += twoPi;
  if (a >= Math.PI) a -= twoPi;
  return a;
};

const shortestAngleDelta = (from: number, to: number) => {
  const f = wrapAngle(from);
  const t = wrapAngle(to);
  let diff = t - f;
  if (diff > Math.PI) diff -= Math.PI * 2;
  else if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
};

// random wander target
function pickWanderTarget(from: THREE.Vector3): THREE.Vector3 {
  const maxStep = BASE_RADIUS * 0.4;
  const step = Math.random() * maxStep;
  const angle = Math.random() * Math.PI * 2;

  const candidate = from.clone().add(
    new THREE.Vector3(
      Math.sin(angle) * step,
      0,
      Math.cos(angle) * step
    )
  );

  const dist = Math.sqrt(candidate.x * candidate.x + candidate.z * candidate.z);
  if (dist > BASE_RADIUS) {
    const scale = BASE_RADIUS / (dist || 1.0);
    candidate.x *= scale;
    candidate.z *= scale;
  }

  return candidate;
}

// floor ellipse params in canvas-space
function getFloorParams(w: number, h: number) {
  const halfH = h * 0.4;
  const baseRpx = w * 0.32;
  const depthRpx = baseRpx * 0.35;
  return { halfH, baseRpx, depthRpx };
}

export default function JarScene() {
    const initialPos = makeVec3(0, -500, 0);

    const [currentPos, setCurrentPos] = useState(() => initialPos.clone());
    const [currentRot, setCurrentRot] = useState(() => makeVec3(0, 0, 0));
    const [mode, setMode] = useState<Mode>('idle');

    // live mirrors for animation loop
    const currentPosRef = useRef<THREE.Vector3>(initialPos.clone());
    const currentRotRef = useRef<THREE.Vector3>(makeVec3(0, 0, 0));
    const modeRef = useRef<Mode>('idle');

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    const targetPosRef = useRef<THREE.Vector3>(initialPos.clone());
    const targetHeadingRef = useRef(0);

    // behavior refs
    const nextDecisionTimeRef = useRef<number>(0);
    const walkPhaseTimeRef = useRef(0);
    const mouseActiveRef = useRef(false);

    useEffect(() => {
        nextDecisionTimeRef.current =
        performance.now() + randBetween(2000, 6000);
    }, []);

    const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    useEffect(() => {
        let frameId: number;

        const animate = () => {
        frameId = requestAnimationFrame(animate);
        const now = performance.now();

        // dt in seconds, clamped
        let dt = 0;
        if (lastTimeRef.current !== null) {
            dt = (now - lastTimeRef.current) / 1000;
            if (dt > 0.05) dt = 0.05;
        }
        lastTimeRef.current = now;

        const targetPos = targetPosRef.current;
        const targetHeading = targetHeadingRef.current;

        {
            const prev = currentPosRef.current;
            const toTarget = targetPos.clone().sub(prev);
            const dist = toTarget.length();
            const next = prev.clone();

            if (modeRef.current === 'walk' && dist > 0 && dt > 0) {
            // walk cadence tied to leg cycle
            walkPhaseTimeRef.current += dt;
            const phase = walkPhaseTimeRef.current * WALK_FREQUENCY;
            const cadenceFactor =
                0.65 + 0.35 * Math.abs(Math.sin(phase));
            const speed = WALK_SPEED * cadenceFactor;
            const maxStep = speed * dt;

            if (dist <= maxStep) {
                next.copy(targetPos);
            } else {
                toTarget.multiplyScalar(maxStep / dist);
                next.add(toTarget);
            }
            } else {
            // gentle slide for non-walk modes
            next.lerp(targetPos, 0.15);
            }

            currentPosRef.current = next;
            setCurrentPos(next);
        }

        {
            const prevRot = currentRotRef.current.clone();
            const delta = shortestAngleDelta(prevRot.y, targetHeading);
            const maxTurn = MAX_TURN_SPEED * dt;
            const step = THREE.MathUtils.clamp(delta, -maxTurn, maxTurn);
            prevRot.y = wrapAngle(prevRot.y + step);
            currentRotRef.current = prevRot;
            setCurrentRot(prevRot);
        }

        const hasMouseTarget = mouseActiveRef.current;
        const distToTarget = currentPosRef.current.distanceTo(
            targetPosRef.current
        );
        const closeEnough = distToTarget < ARRIVAL_RADIUS;

        // stop walking when we basically arrived
        if (closeEnough && modeRef.current === 'walk') {
            targetPosRef.current = currentPosRef.current.clone();
            mouseActiveRef.current = false;

            nextDecisionTimeRef.current = now + randBetween(2000, 6000);
            modeRef.current = 'idle';
            setMode('idle');
        }

        if (!hasMouseTarget) {
            const shouldDecide = now >= nextDecisionTimeRef.current;
            if (shouldDecide) {
            const choice = Math.random();

            if (choice < 0.55) {
                // pick a new wander target
                const from = currentPosRef.current;
                const newTarget = pickWanderTarget(from);
                targetPosRef.current = newTarget;

                const dir = newTarget.clone().sub(from);
                const heading = Math.atan2(dir.x, dir.z);
                targetHeadingRef.current = wrapAngle(heading);

                nextDecisionTimeRef.current =
                now + randBetween(1500, 4000);
                if (modeRef.current !== 'walk') {
                modeRef.current = 'walk';
                setMode('walk');
                }
            } else if (choice < 0.8) {
                // idle stand
                targetPosRef.current = currentPosRef.current.clone();
                nextDecisionTimeRef.current =
                now + randBetween(2000, 6000);
                if (modeRef.current !== 'idle') {
                modeRef.current = 'idle';
                setMode('idle');
                }
            } else {
                // sit
                targetPosRef.current = currentPosRef.current.clone();
                nextDecisionTimeRef.current =
                now + randBetween(4000, 9000);
                if (modeRef.current !== 'sit') {
                modeRef.current = 'sit';
                setMode('sit');
                }
            }
            }
        } else {
            // while mouse is active, always be walking
            if (modeRef.current !== 'walk' && distToTarget > ARRIVAL_RADIUS + 100) {
            modeRef.current = 'walk';
            setMode('walk');
            }
        }
        };

        animate();
        return () => cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
        const canvas = mapCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;

        const w = CANVAS_W;
        const h = CANVAS_H;
        const { halfH, baseRpx, depthRpx } = getFloorParams(w, h);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        // background
        ctx.fillStyle = '#bbddffff';
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // floor ellipse
        ctx.beginPath();
        ctx.ellipse(0, halfH, baseRpx, depthRpx, 0, 0, Math.PI * 2);
        const floorGrad = ctx.createRadialGradient(
        0,
        halfH - baseRpx * 0.1,
        baseRpx * 0.1,
        0,
        halfH,
        baseRpx
        );
        floorGrad.addColorStop(0.0, '#55c04fff');
        floorGrad.addColorStop(1.0, '#88de83ff');
        ctx.fillStyle = floorGrad;
        ctx.fill();

        ctx.restore();
    }, [currentPos]);

    const spriteSdfPos = useMemo(
        () =>
        new THREE.Vector3(
            (currentPos.x / BASE_RADIUS) * 0.9,
            0.0,
            (currentPos.z / BASE_RADIUS) * 0.9
        ),
        [currentPos]
    );

    const spriteSdfRot = useMemo(
        () => new THREE.Vector3(currentRot.x, currentRot.y, currentRot.z),
        [currentRot]
    );

    const spriteScreen = useMemo(() => {
        const w = CANVAS_W;
        const h = CANVAS_H;
        const { halfH, baseRpx, depthRpx } = getFloorParams(w, h);

        const xNorm = THREE.MathUtils.clamp(currentPos.x / BASE_RADIUS, -1, 1);
        const zNorm = THREE.MathUtils.clamp(currentPos.z / BASE_RADIUS, -1, 1);

        const px = xNorm * baseRpx;
        const py = halfH + zNorm * depthRpx;

        const sx = (w / 2 + px) / w;
        const sy = (h / 2 + py) / h;

        return { sx, sy, depthNorm: zNorm };
    }, [currentPos]);

    const spriteScale = useMemo(() => {
        const d = spriteScreen.depthNorm;
        const t = (d + 1) / 2;
        const farScale = 1.0;
        const nearScale = 0.95;
        return farScale + (nearScale - farScale) * t;
    }, [spriteScreen.depthNorm]);

    const camPos = new THREE.Vector3(0, 1.2, 4);
    const camTarget = new THREE.Vector3(0, -0.3, 0);
    const lightDir = new THREE.Vector3(-0.3, 0.9, 0.2).normalize();

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const canvasEl = mapCanvasRef.current;
        if (!canvasEl) return;

        const bounds = canvasEl.getBoundingClientRect();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        const w = bounds.width;
        const h = bounds.height;
        const { halfH, baseRpx, depthRpx } = getFloorParams(w, h);

        const dx = mouseX - w / 2;
        const dyFromCenter = mouseY - (h / 2 + halfH);

        let xNorm = dx / baseRpx;
        let zNorm = dyFromCenter / depthRpx;

        // clamp to circular floor
        const r = Math.sqrt(xNorm * xNorm + zNorm * zNorm);
        if (r > 1) {
            xNorm /= r;
            zNorm /= r;
        }

        const rawTarget = new THREE.Vector3(
            xNorm * BASE_RADIUS,
            initialPos.y,
            zNorm * BASE_RADIUS
        );

        const from = currentPosRef.current;
        const rawDir = rawTarget.clone().sub(from);
        const dist = rawDir.length();

        // small dead zone to avoid jitter when cursor is basically on top
        if (dist < 20) return;

        // smooth target
        const prevTarget = targetPosRef.current;
        const smoothedTarget = prevTarget
            .clone()
            .lerp(rawTarget, 0.25); // 0.2–0.35 feels nice
        targetPosRef.current = smoothedTarget;

        // smooth heading target too
        const desiredHeading = Math.atan2(
            smoothedTarget.x - from.x,
            smoothedTarget.z - from.z
        );
        const currentHeadingTarget = targetHeadingRef.current;
        const headingDelta = shortestAngleDelta(
            currentHeadingTarget,
            desiredHeading
        );
        targetHeadingRef.current = wrapAngle(
            currentHeadingTarget + headingDelta * 0.3
        );

        mouseActiveRef.current = true;
    };

    const handleMouseLeave = () => {
        mouseActiveRef.current = false;
        nextDecisionTimeRef.current =
        performance.now() + randBetween(1000, 4000);
    };

  return (
    <div className="h-full aspect-[3/4] flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div
        className="relative aspect-[3/4] h-full w-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* 2D floor */}
        <canvas
          ref={mapCanvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="absolute inset-0 w-full h-full"
        />

        {/* Sprite div positioned over the floor */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${spriteScreen.sx * 100}%`,
            top: `${spriteScreen.sy * 100}%`,
            transform: `translate(-50%, -50%) scale(${spriteScale})`,
            aspectRatio: '1 / 1',
          }}
        >
          <Sprite
            position={spriteSdfPos}
            rotation={spriteSdfRot}
            pose={mode}
            cameraPos={camPos}
            cameraTarget={camTarget}
            lightDir={lightDir}
          />
        </div>
      </div>
    </div>
  );
}
