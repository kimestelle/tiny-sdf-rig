import { SpriteRig } from '../types'

export const defaultSpriteRig: SpriteRig = {
  id: 'default',
  name: 'Default Sprite Rig',

  spritePosition: { x: 0, y: 0, z: 0 },
  spriteRotation: { x: 0, y: 0, z: 0 },

  bodyPosition: { x: 0, y: 0, z: 0 },
  bodyRotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },

  sizes: {
    body: {
      topRadius: 0.4,
      bottomRadius: 0.2,
      height: 0.6,
    },
    head: {
      radius: 0.3,
    },
    arm: {
      radius: 0.15,
    },
    leg: {
      radius: 0.15,
      width: 0.1,
    },
  },

  joints: {
    head: {
      position: { x: 0, y: 0.6, z: 0 },
      length: 0.2,
      rotation: { x: 0, y: 0, z: 0 },
    },
    leftArm: {
      position: { x: -0.3, y: 0.7, z: 0 },
      length: 0.5,
      rotation: { x: 0, y: 0, z: 0 },
    },
    rightArm: {
      position: { x: 0.3, y: 0.7, z: 0 },
      length: 0.5,
      rotation: { x: 0, y: 0, z: 0 },
    },
    leftLeg: {
      position: { x: -0.25, y: -0.2, z: 0.1 },
      length: 0.2,
      rotation: { x: 0, y: 0, z: 0 },
    },
    rightLeg: {
      position: { x: 0.25, y: -0.2, z: 0.1 },
      length: 0.2,
      rotation: { x: 0, y: 0, z: 0 },
    },
  },

  face: {
    eyes: {
      size: 0.02,
      position: { x: 0.4, y: 0.1, z: 0.28 },
      expression: 'neutral',
    },
    mouth: {
      width: 0.1,
      position: { x: 0, y: -0.1, z: 0.28 },
      expression: 'neutral',
    },
  },
};

export const spriteVertShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// fragment shader with black shiny eyes
export const spriteFragShader = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;

// CAMERA + LIGHT
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform vec3 uLightDir;

// SPRITE ROTATION
uniform vec3 uSpriteRot;

// JOINT UNIFORMS
uniform vec3 uBodyPos;
uniform vec3 uBodyRot;

uniform vec3 uHeadPos;
uniform float uHeadLen;
uniform vec3 uHeadRot;

uniform vec3 uLeftArmPos;
uniform float uLeftArmLen;
uniform vec3 uLeftArmRot;

uniform vec3 uRightArmPos;
uniform float uRightArmLen;
uniform vec3 uRightArmRot;

uniform vec3 uLeftLegPos;
uniform float uLeftLegLen;
uniform vec3 uLeftLegRot;

uniform vec3 uRightLegPos;
uniform float uRightLegLen;
uniform vec3 uRightLegRot;

// SIZE UNIFORMS
// x = topRadius, y = bottomRadius, z = height
uniform vec3 uBodySize;
uniform float uHeadRadius;
uniform float uArmRadius;
// x = leg radius, y = leg width
uniform vec2 uLegSize;

// FACE UNIFORMS
uniform vec2 uEyeOffset;
uniform float uEyeRadius;
uniform vec2 uMouthOffset;
uniform vec2 uMouthSize;
uniform float uFaceBlend;

// SDF HELPERS
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float sdRoundCone(vec3 p, float r1, float r2, float h) {
    float b = (r1 - r2) / h;
    float a = sqrt(1.0 - b*b);

    vec2 q = vec2(length(p.xz), p.y);
    float k = dot(q, vec2(-b, a));
    if (k < 0.0)    return length(q) - r1;
    if (k > a * h)  return length(q - vec2(0.0, h)) - r2;
    return dot(q, vec2(a, b)) - r1;
}

// hemisphere with flat side facing down (y >= 0)
float sdRoundHemisphere(vec3 p, float r, float w) {
    float dSphere = length(p) - r;
    float dPlane  = -p.y;  // inside is y >= 0
    return max(dSphere, dPlane);
}

float opSmoothUnion(float d1, float d2, float k) {
    k *= 4.0;
    float h = max(k - abs(d1 - d2), 0.0);
    return min(d1, d2) - h*h*0.25 / k;
}

// rotation helpers
vec3 rotateX(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
}

vec3 rotateZ(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z);
}

vec3 rotateY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c);
}

vec3 rotateXYZ(vec3 p, vec3 a) {
    p = rotateX(p, a.x);
    p = rotateY(p, a.y);
    p = rotateZ(p, a.z);
    return p;
}

float sceneSDF(vec3 plocal) {
    // body (torso)
    float dBody = sdRoundCone(
        plocal - uBodyPos,
        uBodySize.x,
        uBodySize.y,
        uBodySize.z
    );

    // head: sphere offset from head joint along rotated +Y
    vec3 headDir    = rotateXYZ(vec3(0.0, 1.0, 0.0), uHeadRot);
    vec3 headCenter = uHeadPos + headDir * uHeadLen;
    float dHead     = sdSphere(plocal - headCenter, uHeadRadius);

    vec3 baseDir = vec3(0.0, -1.0, 0.0);

    // legs
    vec3 legDirL        = rotateXYZ(baseDir, uLeftLegRot);
    vec3 leftFootCenter = uLeftLegPos + legDirL * uLeftLegLen;
    float dLeftLeg      = sdRoundHemisphere(plocal - leftFootCenter, uLegSize.x, uLegSize.y);

    vec3 legDirR         = rotateXYZ(baseDir, uRightLegRot);
    vec3 rightFootCenter = uRightLegPos + legDirR * uRightLegLen;
    float dRightLeg      = sdRoundHemisphere(plocal - rightFootCenter, uLegSize.x, uLegSize.y);

    // arms
    vec3 armDirL        = rotateXYZ(baseDir, uLeftArmRot);
    vec3 leftHandCenter = uLeftArmPos + armDirL * uLeftArmLen;
    float dLeftArm      = sdSphere(plocal - leftHandCenter, uArmRadius);

    vec3 armDirR         = rotateXYZ(baseDir, uRightArmRot);
    vec3 rightHandCenter = uRightArmPos + armDirR * uRightArmLen;
    float dRightArm      = sdSphere(plocal - rightHandCenter, uArmRadius);

    // smooth unions -> single SDF
    float d = dBody;
    d = opSmoothUnion(d, dHead,      0.02);
    d = opSmoothUnion(d, dLeftArm,   0.01);
    d = opSmoothUnion(d, dRightArm,  0.01);
    d = opSmoothUnion(d, dLeftLeg,   0.05);
    d = opSmoothUnion(d, dRightLeg,  0.05);

    return d;
}

// Normal from SDF
vec3 calcNormal(vec3 plocal) {
    float e = 0.001;
    vec2 h = vec2(e, 0.0);

    float dx = sceneSDF(plocal + vec3(h.x, h.y, h.y)) - sceneSDF(plocal - vec3(h.x, h.y, h.y));
    float dy = sceneSDF(plocal + vec3(h.y, h.x, h.y)) - sceneSDF(plocal - vec3(h.y, h.x, h.y));
    float dz = sceneSDF(plocal + vec3(h.y, h.y, h.x)) - sceneSDF(plocal - vec3(h.y, h.y, h.x));

    return normalize(vec3(dx, dy, dz));
}

vec3 localNormalToWorld(vec3 nLocal) {
    // inverse of rotateY(plocal, uSpriteRot.y)
    return rotateY(nLocal, -uSpriteRot.y);
}

// Basic lighting for the full body
vec3 shadeBody(vec3 plocalHit, vec3 Nlocal) {
    vec3 N = normalize(localNormalToWorld(Nlocal));
    vec3 L = normalize(uLightDir);
    float diff = max(dot(N, L), 0.0);
    float ambient = 0.25;

    vec3 skin = vec3(1.0, 0.8, 0.7);
    return skin * (ambient + diff);
}

vec3 shadeFace(vec3 plocalHit, vec3 Nlocal, vec3 bodyLitColor) {
    if (uFaceBlend <= 0.0) return bodyLitColor;
    vec3 N = normalize(localNormalToWorld(Nlocal));
    // Head center (same as sceneSDF)
    vec3 headDir    = rotateXYZ(vec3(0.0, 1.0, 0.0), uHeadRot);
    vec3 headCenter = uHeadPos + headDir * uHeadLen;
    vec3 headLocal  = plocalHit - headCenter;

    // Only draw on front hemisphere
    if (headLocal.z < 0.0) {
        return bodyLitColor;
    }

    // Normalize to "face space" in [-1,1] by radius
    vec2 facePos = headLocal.xy / max(uHeadRadius, 1e-4);

    // EYES (Discs with Specular)
    vec2 leftEyeCenter  = vec2(-uEyeOffset.x, uEyeOffset.y);
    vec2 rightEyeCenter = vec2( uEyeOffset.x, uEyeOffset.y);
    float eyeR = uEyeRadius;

    float dEyeL = length(facePos - leftEyeCenter);
    float dEyeR = length(facePos - rightEyeCenter);
    float eyeMaskL = 1.0 - smoothstep(eyeR, eyeR + 0.05, dEyeL);
    float eyeMaskR = 1.0 - smoothstep(eyeR, eyeR + 0.05, dEyeR);
    float eyeMask  = max(eyeMaskL, eyeMaskR);

    // base black
    vec3 eyeBase = vec3(0.02, 0.02, 0.03);

    // shared light / view for specular
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uCamPos - (uBodyPos)); // rough view dir
    vec3 H = normalize(L + V);

    float spec = pow(max(dot(N, H), 0.0), 32.0);
    vec3 eyeSpecColor = vec3(1.0);    // white highlight
    vec3 eyeColor = eyeBase + eyeSpecColor * spec * 0.6;

    // // --- Mouth: simple darker band ---
    // vec2 mouthCenter = vec2(0.0, uMouthOffset.y);
    // vec2 mouthSize   = uMouthSize; // width, height in normalized space

    // vec2 m = abs(facePos - mouthCenter) / mouthSize;
    // float mouthBand = max(m.x, m.y);
    // float mouthMask = 1.0 - smoothstep(1.0, 1.03, mouthBand);

    // vec3 mouthColor = vec3(0.25, 0.08, 0.1);

    vec3 color = bodyLitColor;

    // apply eyes
    color = mix(color, eyeColor, eyeMask * uFaceBlend);

    // // apply mouth (not over eyes)
    // float mouthWeight = mouthMask * uFaceBlend * (1.0 - eyeMask);
    // color = mix(color, mouthColor, mouthWeight);

    return color;
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;

    // diorama-style camera from uniforms
    vec3 ro = uCamPos;
    vec3 target = uCamTarget;

    vec3 ww = normalize(target - ro);
    vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));
    vec3 vv = cross(ww, uu);

    float focal = 1.8; // controls FOV
    vec3 rd = normalize(uv.x * uu + uv.y * vv + focal * ww);

    float t = 0.0;
    float tMax = 8.0;
    float precis = 0.002;
    float h = precis * 2.0;

    bool hit = false;
    vec3 pHit = vec3(0.0);

    // ray march
    for (int i = 0; i < 96; i++) {
        if (h < precis || t > tMax) break;

        vec3 p = ro + t * rd;
        vec3 plocal = p - uBodyPos;
        plocal = rotateY(plocal, uSpriteRot.y);

        h = sceneSDF(plocal);
        t += h;
    }

    if (t < tMax) {
        hit = true;
        pHit = ro + rd * t;
    }

    vec4 col = vec4(0.0);

    if (hit) {
        vec3 plocalHit = pHit - uBodyPos;
        plocalHit = rotateY(plocalHit, uSpriteRot.y);

        vec3 N = calcNormal(plocalHit);

        vec3 bodyLit    = shadeBody(plocalHit, N);
        vec3 finalColor = shadeFace(plocalHit, N, bodyLit);

        col = vec4(finalColor, 1.0);
    } 
       // --- planar shadow on a ground plane in world space ---

    // approximate ground plane slightly below body center
    float groundY = uBodyPos.y - (uBodySize.z * 0.5 + uLegSize.x * 0.5);

    float tPlane = (groundY - ro.y) / rd.y;
    if (tPlane > 0.0 && tPlane < tMax) {
        vec3 gWorld = ro + rd * tPlane;

        // sprite-local ground point
        vec3 gLocal = gWorld - uBodyPos;
        gLocal = rotateY(gLocal, uSpriteRot.y);

        // build a tiny ellipse oriented opposite the light direction
        vec2 lightXZ = normalize(uLightDir.xz + vec2(1e-5)); // avoid NaN
        vec2 perp    = vec2(-lightXZ.y, lightXZ.x);

        float along   = dot(gLocal.xz, lightXZ);
        float across  = dot(gLocal.xz, perp);

        // tune these for size/shape of the shadow
        float shadowLen   = 0.6;  // length along light
        float shadowWidth = 0.35; // width perpendicular

        float u = along / shadowLen;
        float v = across / shadowWidth;

        float r2   = u*u + v*v;
        float mask = clamp(1.0 - r2, 0.0, 1.0);
        mask *= mask;  // soften edges

        // very local: ignore far samples
        if (r2 < 1.5) {
            float shadowStrength = 0.4 * mask;
            vec3 shadowColor = vec3(0.0);

            // darken whatever we already computed (body or empty)
            col.rgb = mix(col.rgb, shadowColor, shadowStrength);
            col.a   = max(col.a, shadowStrength);
        }
    }

    gl_FragColor = col;
}

`;