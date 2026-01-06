'use client';

import * as THREE from 'three';
import { SpriteRig, Garden } from './types'

// Gene schema:
/*
Sprite
- unique id
- name

Structure
- rig (sizes, joint positions)

Colors and Textures
- base color
- base texture

Personality
- poses: idle, walk, sit, etc
- expression : happy, sad, angry
- activity level: low, medium, high
- affinity: friendly, passive, avoidant

Accessories
- hand-held object (e.g., book, tool, weapon)
- misc shader injection (e.g., glow effect, pattern overlay)

Environment
- ground material
- sky material
- lighting
- objects: trees, rocks, bench, house, etc.

Message (optional)
- text
*/

export type Object = {
    id: number;
    type: string;
    shaderSnippet: string;
    position: { x: number; y: number; z: number; };
    scale: { x: number; y: number; z: number; };
    rotation: { x: number; y: number; z: number; };
}

export type Gene = {
    id: number;
    name: string;

    //structure
    rig: SpriteRig;

    //colors and textures
    baseColor: string;
    baseTexture: THREE.Texture;

    //personality
    poses: string[];
    expression: string;
    activityLevel: number;
    affinity: number;

    //accessories
    handHeldObject?: string;
    miscShaderSnippet?: string;

    //environment
    garden: Garden;
}