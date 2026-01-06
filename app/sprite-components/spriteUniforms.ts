import * as THREE from 'three';
import type { SpriteRig } from '../types';

type SpritePropsForUniforms = {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  cameraPos?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
  lightDir?: THREE.Vector3;
};

export function applyRigUniforms(
  uniforms: Record<string, THREE.IUniform>,
  rig: SpriteRig,
  props: SpritePropsForUniforms
) {

  if (!uniforms ||!props || !rig ) return;

  uniforms.uBodyPos = {
    value: new THREE.Vector3(
      rig.bodyPosition.x, 
      rig.bodyPosition.y, 
      rig.bodyPosition.z),
  }

  //size variables
  // x = topRadius, y = bottomRadius, z = height
  // uniform vec3 uBodySize;
  // uniform float uHeadRadius;
  // uniform float uArmRadius;
  // x = leg radius, y = leg width
  // uniform vec2 uLegSize;
  uniforms.uHeadRadius = {
    value: rig.sizes.head.radius
  }
  uniforms.uBodySize = {
    value: new THREE.Vector3(
      rig.sizes.body.topRadius, 
      rig.sizes.body.bottomRadius, 
      rig.sizes.body.height)
  }
  uniforms.uArmRadius = {
    value: rig.sizes.arm.radius  
  }
  uniforms.uLegSize = {
    value: new THREE.Vector2(rig.sizes.leg.radius, rig.sizes.leg.width)
  }

  // sprite rotation
  const spriteRot = props.rotation ?? rig.spriteRotation;
  uniforms.uSpriteRot = {
    value: new THREE.Vector3(spriteRot.x, spriteRot.y, spriteRot.z),
  }

  // joints
  const head = rig.joints.head;
  uniforms.uHeadPos = {
    value: new THREE.Vector3(head.position.x, head.position.y, head.position.z)
  }
  uniforms.uHeadRot = {
    value: new THREE.Vector3(head.rotation.x, head.rotation.y, head.rotation.z)
  }

  const leftArm = rig.joints.leftArm;
  uniforms.uLeftArmPos = {
    value: new THREE.Vector3(leftArm.position.x, leftArm.position.y, leftArm.position.z)    
  }
  uniforms.uLeftArmLen = {
    value: leftArm.length 
  }
  uniforms.uLeftArmRot = {
    value: new THREE.Vector3(leftArm.rotation.x, leftArm.rotation.y, leftArm.rotation.z)
  }

  const rightArm = rig.joints.rightArm
  uniforms.uRightArmPos = {
    value: new THREE.Vector3(rightArm.position.x, rightArm.position.y, rightArm.position.z)    
  }
  uniforms.uRightArmLen = {
    value: rightArm.length 
  }
  uniforms.uRightArmRot = {
    value: new THREE.Vector3(rightArm.rotation.x, rightArm.rotation.y, rightArm.rotation.z)
  };

  const leftLeg = rig.joints.leftLeg
  uniforms.uLeftLegPos = {
    value: new THREE.Vector3(leftLeg.position.x, leftLeg.position.y, leftLeg.position.z)
  }
  uniforms.uLeftLegLen = {
    value: leftLeg.length
  }
  uniforms.uLeftLegRot = {
    value: new THREE.Vector3(leftLeg.rotation.x, leftLeg.rotation.y, leftLeg.rotation.z)
  };

  const rightLeg = rig.joints.rightLeg
  uniforms.uRightLegPos = {
    value: new THREE.Vector3(rightLeg.position.x, rightLeg.position.y, rightLeg.position.z)
  }
  uniforms.uRightLegLen = {
    value: rightLeg.length
  }
  uniforms.uRightLegRot = {
    value: new THREE.Vector3(rightLeg.rotation.x, rightLeg.rotation.y, rightLeg.rotation.z)
  };

  // face variables
  // uniform vec2 uEyeOffset;
  // uniform float uEyeRadius;
  // uniform vec2 uMouthOffset;
  // uniform vec2 uMouthSize;
  // uniform float uFaceBlend;
  const face = rig.face
  uniforms.uEyeOffset = {
    value: new THREE.Vector3(face.eyes.position.x, face.eyes.position.y)
  }
  uniforms.uEyeRadius = {
    value: face.eyes.size
  }
  uniforms.uMouthOffset = {
    value: new THREE.Vector2(face.mouth.position.x, face.mouth.position.y)
  }
  uniforms.uMouthSize = {
    value: new THREE.Vector2(face.mouth.width, face.mouth.width)
  }
  uniforms.uFaceBlend = {
    value: 1
  }

  // camera and lights
  if (props.cameraPos) {
    uniforms.uCamPos.value.copy(props.cameraPos);
  }
  if (props.cameraTarget) {
    uniforms.uCamTarget.value.copy(props.cameraTarget);
  }
  if (props.lightDir) {
    uniforms.uLightDir.value.copy(props.lightDir.clone().normalize());
  }
}
