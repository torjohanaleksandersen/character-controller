import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

function filterClipByBones(clip, allowedBones = []) {
  const tracks = clip.tracks.filter((track) =>
    allowedBones.some((boneName) => track.name.startsWith(boneName + "."))
  );

  return new THREE.AnimationClip(
    `${clip.name}_${allowedBones.length ? "partial" : "full"}`,
    clip.duration,
    tracks
  );
}

export class AnimationLibrary {
  constructor() {
    this.loader = new FBXLoader();
    this.clips = {
      upper: {},
      lower: {},
      full: {}
    };

    this.upperBodyBones = [
      "mixamorigSpine",
      "mixamorigSpine1",
      "mixamorigSpine2",
      "mixamorigNeck",
      "mixamorigHead",
      "mixamorigLeftShoulder",
      "mixamorigLeftArm",
      "mixamorigLeftForeArm",
      "mixamorigLeftHand",
      "mixamorigRightShoulder",
      "mixamorigRightArm",
      "mixamorigRightForeArm",
      "mixamorigRightHand"
    ];

    this.lowerBodyBones = [
      "mixamorigHips",
      "mixamorigLeftUpLeg",
      "mixamorigLeftLeg",
      "mixamorigLeftFoot",
      "mixamorigLeftToeBase",
      "mixamorigRightUpLeg",
      "mixamorigRightLeg",
      "mixamorigRightFoot",
      "mixamorigRightToeBase"
    ];
  }

  async loadAnimation(name, parts = ["full"]) {
    const fbx = await this.loader.loadAsync(`/animations/${name}.fbx`);
    const clip = fbx.animations[0];

    if (!clip) {
      console.warn(`No animation clip found in ${name}.fbx`);
      return;
    }

    if (parts.includes("full")) {
      this.clips.full[name] = clip;
    }

    if (parts.includes("upper")) {
      this.clips.upper[name] = filterClipByBones(clip, this.upperBodyBones);
    }

    if (parts.includes("lower")) {
      this.clips.lower[name] = filterClipByBones(clip, this.lowerBodyBones);
    }
  }

  async loadAll() {
    await Promise.all([
      this.loadAnimation("idle", ["lower", "upper"]),
      this.loadAnimation("walk-forward", ["lower", "upper"]),
      this.loadAnimation("walk-backward", ["lower", "upper"]),
    ]);
  }

  getClip(layer, name) {
    return this.clips[layer]?.[name] || null;
  }

  hasClip(layer, name) {
    return !!this.getClip(layer, name);
  }
}