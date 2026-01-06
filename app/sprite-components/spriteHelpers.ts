import { SpriteRig } from "../types";

export function spriteWalkCycle(rig: SpriteRig, time: number): SpriteRig {
  const walkAmplitude = 0.5;
  const walkFrequency = 6.0;

  const leftLegAngle = Math.sin(time * walkFrequency) * walkAmplitude;
  const rightLegAngle = Math.sin(time * walkFrequency + Math.PI) * walkAmplitude;
  const leftArmAngle = Math.sin(time * walkFrequency + Math.PI) * walkAmplitude * 0.7;
  const rightArmAngle = Math.sin(time * walkFrequency) * walkAmplitude * 0.7;
  return {
    ...rig,
    joints: {
      ...rig.joints,
      head: {
        ...rig.joints.head,
        rotation: { x: 0.1 * Math.sin(time * walkFrequency), y: 0, z: 0 },
      },
      leftLeg: {
        ...rig.joints.leftLeg,
        rotation: { x: leftLegAngle, y: 0, z: 0 },
      },
      rightLeg: {
        ...rig.joints.rightLeg,
        rotation: { x: rightLegAngle, y: 0, z: 0 },
      },
      leftArm: {
        ...rig  .joints.leftArm,
        rotation: { x: leftArmAngle, y: 0, z: 0 },
      },
      rightArm: {
        ...rig.joints.rightArm,
        rotation: { x: rightArmAngle, y: 0, z: 0 },
      },
    },
  };
}   

export function spriteSit(rig: SpriteRig, time: number): SpriteRig {
    const breath = 0.05 * Math.sin(time * 2.0);
    return {
      ...rig,
      bodyPosition: {
        ...rig.bodyPosition,
        y: rig.bodyPosition.y - 0.08 + 0.01 * Math.sin(time),
      },
      joints: {
        ...rig.joints,
        head: {
          ...rig.joints.head,
          position: { ...rig.joints.head.position, y: rig.joints.head.position.y + 0.01 + 0.008 * Math.sin(time)},
          rotation: { x: 0.05 * Math.sin(time), y: 0, z: 0 },
        },
        leftLeg: {
          ...rig.joints.leftLeg,
          rotation: { x: -1.0 + breath, y: 0, z: 0.5 },
        },
        rightLeg: {
          ...rig.joints.rightLeg,
          rotation: { x: -1.0 + breath, y: 0, z: 0.5 },
        },
        leftArm: {
          ...rig.joints.leftArm,
          rotation: { x: -0.3 + breath, y: 0, z: 0 },
        },
        rightArm: {
          ...rig.joints.rightArm,
          rotation: { x: -0.3 + breath, y: 0, z: 0 },
        },
      },
      sizes: {
        ...rig.sizes,
        body: {
          ...rig.sizes.body,
          bottomRadius: rig.sizes.body.bottomRadius * 1.2
        }
      },
    };
} 

export function spriteIdle(rig: SpriteRig, time: number): SpriteRig {
    const breath = 0.05 * Math.sin(time * 2.0);
    return {
      ...rig,
      bodyPosition: {
        ...rig.bodyPosition,
        y: rig.bodyPosition.y + 0.01 * Math.sin(time),
      },
      joints: {
        ...rig.joints,
        head: {
          ...rig.joints.head,
          rotation: { x: 0.05 * Math.sin(time), y: 0, z: 0 },
        },
        leftArm: {
          ...rig.joints.leftArm,
          rotation: { x: breath, y: 0, z: 0 },
        },
        rightArm: {
          ...rig.joints.rightArm,
          rotation: { x: breath, y: 0, z: 0 },
        },
      },
    };
}