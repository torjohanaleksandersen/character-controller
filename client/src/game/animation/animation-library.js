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

function reverseClip(clip, newName = `${clip.name}_reversed`) {
  const reversedTracks = clip.tracks.map((track) => {
    const TrackType = track.constructor;
    const valueSize = track.getValueSize();
    const times = Array.from(track.times);
    const values = Array.from(track.values);

    const reversedTimes = new track.times.constructor(times.length);
    const reversedValues = new track.values.constructor(values.length);

    for (let i = 0; i < times.length; i++) {
      reversedTimes[i] = clip.duration - times[times.length - 1 - i];
    }

    for (let i = 0; i < times.length; i++) {
      const srcKeyIndex = times.length - 1 - i;

      for (let j = 0; j < valueSize; j++) {
        reversedValues[i * valueSize + j] = values[srcKeyIndex * valueSize + j];
      }
    }

    return new TrackType(
      track.name,
      reversedTimes,
      reversedValues,
      track.getInterpolation()
    );
  });

  return new THREE.AnimationClip(newName, clip.duration, reversedTracks);
}

export class AnimationLibrary {
  constructor() {
    this.loader = new FBXLoader();
    this.clips = {
      upper: {},
      lower: {},
      full: {}
    };
    this.timeScales = {};

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

  registerClip(name, clip, parts = ["full"], timeScale = 1.0) {
    this.timeScales[name] = timeScale;

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

  async loadAnimation(name, parts = ["full"], timeScale = 1.0) {
    const fbx = await this.loader.loadAsync(`/animations/${name}.fbx`);
    const clip = fbx.animations[0];

    if (!clip) {
      console.warn(`No animation clip found in ${name}.fbx`);
      return;
    }

    this.registerClip(name, clip, parts, timeScale);
  }

  async loadAll() {
    await Promise.all([
      this.loadAnimation("idle", ["lower", "upper"]),
      this.loadAnimation("walk-forward", ["lower", "upper"]),
      this.loadAnimation("walk-right", ["lower", "upper"], 1.103),
      this.loadAnimation("walk-left", ["lower", "upper"], 1.103),

      this.loadAnimation("idle-rifle-aiming", ["upper"]),
      this.loadAnimation("walk-rifle-aiming", ["upper"]),
    ]);

    const walkForwardLower = this.clips.lower["walk-forward"];
    const walkForwardUpper = this.clips.upper["walk-forward"];

    if (walkForwardLower) {
      this.clips.lower["walk-backward"] = reverseClip(walkForwardLower, "walk-backward");
    }

    if (walkForwardUpper) {
      this.clips.upper["walk-backward"] = reverseClip(walkForwardUpper, "walk-backward");
    }

    this.timeScales["walk-backward"] = this.timeScales["walk-forward"] ?? 1.0;

    const walkRightLower = this.clips.lower["walk-right"];
    const walkRightUpper = this.clips.upper["walk-right"];

    if (walkRightLower) {
      this.clips.lower["walk-left_reversed"] = reverseClip(walkRightLower, "walk-left_reversed");
    }

    if (walkRightUpper) {
      this.clips.upper["walk-left_reversed"] = reverseClip(walkRightUpper, "walk-left_reversed");
    }

    this.timeScales["walk-left_reversed"] = this.timeScales["walk-right"] ?? 1.0;
  }

  getClip(layer, name) {
    return this.clips[layer]?.[name] || null;
  }

  getTimeScale(name) {
    return this.timeScales[name] ?? 1.0;
  }

  hasClip(layer, name) {
    return !!this.getClip(layer, name);
  }
}