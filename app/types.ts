import * as THREE from 'three'


/*
    Garden
*/
export type Flower = {
    texture: ImageBitmap;
    position: { angle: number, distance: number }
    message: string;
}
export type Garden = {
    flowers: Flower[];
}

/*
    Sprite 
*/
export type SpritePose = 'idle' | 'walk' | 'sit';

export type SpriteProps = {
  position?: THREE.Vector3;
  rotation?: THREE.Vector3;
  pose?: SpritePose;
  cameraPos?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
  lightDir?: THREE.Vector3;
};

/*
Joint Structure:
- entire body: position (based on center of torso) and rotation
- head: rotation (position is at neck and fixed relative to body)
- arms: position relative to body (within a certain radius), angle of rotation
- legs: position relative to body (within a certain radius), angle of rotation
*/

export type SpriteRig = {
  id: string;
  name: string;

  // overall sprite position and rotation in world space
  spritePosition: { x: number; y: number; z: number };
  spriteRotation: { x: number; y: number; z: number };

  // RELATIVE COORDINATES
  bodyPosition: { x: number; y: number; z: number };
  bodyRotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };

  // sizes for each body part
  sizes: {
    body: {
      topRadius: number;    // sdRoundCone r1
      bottomRadius: number; // sdRoundCone r2
      height: number;       // sdRoundCone h
    };
    head: {
      radius: number;
    };
    arm: {
      radius: number;       // arm sphere radius
    };
    leg: {
      radius: number;       // leg semi-circle radius
      width: number;        // leg semi-circle width
    };
  };

  // node tree for joints (positions are offsets from body)
  joints: {
    head: {
      position: { x: number; y: number; z: number };
      length: number;
      rotation: { x: number; y: number; z: number };
    };
    leftArm: {
      position: { x: number; y: number; z: number };
      length: number;
      rotation: { x: number; y: number; z: number };
    };
    rightArm: {
      position: { x: number; y: number; z: number };
      length: number;
      rotation: { x: number; y: number; z: number };
    };
    leftLeg: {
      position: { x: number; y: number; z: number };
      length: number;
      rotation: { x: number; y: number; z: number };
    };
    rightLeg: {
      position: { x: number; y: number; z: number };
      length: number;
      rotation: { x: number; y: number; z: number };
    };
  };

  // facial features (meta; we won't over-use them yet)
  face: {
    eyes: {
      size: number;
      position: { x: number; y: number; z: number }; // center between eyes
      expression: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
    };
    mouth: {
      width: number;
      position: { x: number; y: number; z: number };
      expression: 'neutral' | 'smile' | 'frown' | 'open';
    };
  };
};