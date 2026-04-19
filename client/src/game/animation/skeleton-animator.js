import * as THREE from "three";
import { animationLibrary } from "../../main";

export class SkeletonAnimator {
  constructor(character) {
    this.character = character;
    this.mixer = new THREE.AnimationMixer(character);

    this.layers = {
      upper: {
        actions: {},
        current: null,
        currentName: "",
        active: new Set(),
        mode: "single",
        currentWeights: {},
        targetWeights: {},
        blendSpeed: 10
      },
      lower: {
        actions: {},
        current: null,
        currentName: "",
        active: new Set(),
        mode: "single",
        currentWeights: {},
        targetWeights: {},
        blendSpeed: 10
      },
      full: {
        actions: {},
        current: null,
        currentName: "",
        active: new Set(),
        mode: "single",
        currentWeights: {},
        targetWeights: {},
        blendSpeed: 10
      }
    };

    this.#buildActions();
  }

  #buildActions() {
    ["upper", "lower", "full"].forEach((layerName) => {
      const clips = animationLibrary.clips[layerName] || {};

      Object.entries(clips).forEach(([name, clip]) => {
        const action = this.mixer.clipAction(clip);
        action.enabled = true;
        action.clampWhenFinished = false;
        action.setLoop(THREE.LoopRepeat);
        this.layers[layerName].actions[name] = action;
      });
    });
  }

  playUpper(name, weight = 1, fade = 0.15, once = false) {
    this.#playOnLayer("upper", name, fade, weight, once);
  }

  playLower(name, weight = 1, fade = 0.15, once = false) {
    this.#playOnLayer("lower", name, fade, weight, once);
  }

  playFull(name, weight = 1, fade = 0.15, once = false) {
    this.stopUpper(fade);
    this.stopLower(fade);
    this.#playOnLayer("full", name, fade, weight, once);
  }

  stopUpper(fade = 0.15) {
    this.#stopLayer("upper", fade);
  }

  stopLower(fade = 0.15) {
    this.#stopLayer("lower", fade);
  }

  stopFull(fade = 0.15) {
    this.#stopLayer("full", fade);
  }

  update(dt) {
    this.#updateWeightedLayer("upper", dt);
    this.#updateWeightedLayer("lower", dt);
    this.#updateWeightedLayer("full", dt);

    this.mixer.update(dt);
  }

  playWeighted(layerName, weights, fade = 0.15) {
    const layer = this.layers[layerName];
    if (!layer) return;

    layer.mode = "weighted";
    layer.current = null;
    layer.currentName = "";

    // Ensure every weighted action exists and is playing
    for (const [name, targetWeight] of Object.entries(weights)) {
      const action = layer.actions[name];

      if (!action) {
        console.warn(`No "${name}" animation on layer "${layerName}"`);
        continue;
      }

      if (!layer.active.has(name)) {
        action.reset();
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(0);
        action.play();

        layer.active.add(name);
        layer.currentWeights[name] = 0;
      }

      layer.targetWeights[name] = targetWeight;
    }

    // For active actions not in new weights, target them to zero
    for (const name of layer.active) {
      if (!(name in weights)) {
        layer.targetWeights[name] = 0;
      }
    }
  }

  clearWeighted(layerName, fade = 0.15) {
    const layer = this.layers[layerName];
    if (!layer) return;

    for (const name of layer.active) {
      layer.targetWeights[name] = 0;
    }

    layer.mode = "single";
  }

  #updateWeightedLayer(layerName, dt) {
    const layer = this.layers[layerName];
    if (!layer) return;

    if (layer.active.size === 0) return;

    const t = 1 - Math.exp(-layer.blendSpeed * dt);

    for (const name of [...layer.active]) {
      const action = layer.actions[name];
      if (!action) continue;

      const current = layer.currentWeights[name] ?? 0;
      const target = layer.targetWeights[name] ?? 0;

      const next = THREE.MathUtils.lerp(current, target, t);
      layer.currentWeights[name] = next;

      action.enabled = true;
      action.setEffectiveWeight(next);

      // Stop fully faded actions
      if (next < 0.001 && target < 0.001) {
        action.stop();
        layer.active.delete(name);
        delete layer.currentWeights[name];
        delete layer.targetWeights[name];
      }
    }
  }

  #playOnLayer(layerName, animationName, fade = 0.15, weight = 1, once = false) {
    const layer = this.layers[layerName];
    const action = layer.actions[animationName];

    if (!action) {
      console.warn(`No "${animationName}" animation on layer "${layerName}"`);
      return;
    }

    if (layer.active.size > 0) {
      for (const name of [...layer.active]) {
        const a = layer.actions[name];
        if (a) a.stop();
      }
      layer.active.clear();
      layer.currentWeights = {};
      layer.targetWeights = {};
    }

    layer.mode = "single";

    if (layer.currentName === animationName) {
      action.setEffectiveWeight(weight);
      return;
    }

    if (layer.current) {
      layer.current.fadeOut(fade);
    }

    action.reset();
    if (once) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
    action.fadeIn(fade);
    action.play();

    layer.current = action;
    layer.currentName = animationName;
  }

  #stopLayer(layerName, fade = 0.15) {
    const layer = this.layers[layerName];

    for (const name of [...layer.active]) {
      layer.targetWeights[name] = 0;
    }

    if (!layer.current) return;

    layer.current.fadeOut(fade);
    layer.current = null;
    layer.currentName = "";
  }
}