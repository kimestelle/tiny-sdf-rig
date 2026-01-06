'use client';

import * as THREE from 'three';
import { useRef, useEffect } from 'react';

import { spriteVertShader, spriteFragShader, defaultSpriteRig } from './spriteRig';
import { spriteWalkCycle, spriteSit, spriteIdle } from './spriteHelpers';  
import { applyRigUniforms } from './spriteUniforms';
import { SpriteRig, SpriteProps, SpritePose } from '../types'

export default function Sprite({
  position,
  pose = 'walk',
  rotation,
  cameraPos,
  cameraTarget,
  lightDir,
}: SpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);

  const propsRef = useRef<{
    position?: THREE.Vector3;
    pose: SpritePose;
    rotation?: THREE.Vector3;
    cameraPos?: THREE.Vector3;
    cameraTarget?: THREE.Vector3;
    lightDir?: THREE.Vector3;
  }>({
    position,
    pose,
    rotation,
    cameraPos,
    cameraTarget,
    lightDir,
  });

  useEffect(() => {
    propsRef.current = {
      position,
      pose,
      rotation,
      cameraPos,
      cameraTarget,
      lightDir,
    };
  }, [position, pose, rotation, cameraPos, cameraTarget, lightDir]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    const parentRect = canvas.parentElement?.getBoundingClientRect();
    const parentWidth = parentRect?.width ?? 400;
    const parentHeight = parentRect?.height ?? 400;
    const sideCSS = Math.min(parentWidth, parentHeight);
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${sideCSS}px`;
    canvas.style.height = `${sideCSS}px`;

    const side = sideCSS * dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(sideCSS, sideCSS, false);

    const baseRig: SpriteRig = defaultSpriteRig;
    const uniforms = {} as Record<string, THREE.IUniform>;

    uniforms.uTime = { value: 0.0 };
    uniforms.uResolution = {
      value: new THREE.Vector2(side, side),
    };

    uniforms.uCamPos = {
      value: new THREE.Vector3(0, 1.2, 4),
    };
    uniforms.uCamTarget = {
      value: new THREE.Vector3(0, -0.3, 0),
    };
    uniforms.uLightDir = {
      value: new THREE.Vector3(-0.3, 0.9, 0.2).normalize(),
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: spriteVertShader,
      fragmentShader: spriteFragShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let frameId: number;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        timeRef.current += 0.01;
        uniforms.uTime.value = timeRef.current;

        const current = propsRef.current;
        let rig: SpriteRig = baseRig;

        if (current.pose === 'walk') {
            rig = spriteWalkCycle(baseRig, timeRef.current);
        } else if (current.pose === 'sit') {
            rig = spriteSit(baseRig, timeRef.current);
        } else if (current.pose === 'idle') {
            rig = spriteIdle(baseRig, timeRef.current);
        }

        applyRigUniforms(uniforms, rig, {
        position: current.position,
        rotation: current.rotation,
        cameraPos: current.cameraPos,
        cameraTarget: current.cameraTarget,
        lightDir: current.lightDir,
        });

        mesh.material.uniforms = uniforms;

        // console.log(mesh.material.uniforms.uBodySize)
        
        renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

    return (
    <canvas
        ref={canvasRef}
        style={{
        display: 'block',
        width: '100%',
        height: '100%',
        background: 'transparent',
        }}
    />
    );
}
