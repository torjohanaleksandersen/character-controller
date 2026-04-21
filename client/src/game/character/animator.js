import * as THREE from "three";
import { SkeletonAnimator } from "../animation/skeleton-animator";

export class Animator {
    constructor(mesh = new THREE.Object3D()) {
        this.mesh = mesh;
        this.skeletonAnimator = new SkeletonAnimator(mesh);
    }

    computeLowerWeights(moveX = 0, moveY = 0) {
        const animX = moveY < 0 ? -moveX : moveX;

        const weights = {
            "walk-forward": Math.max(0, moveY),
            "walk-backward": Math.max(0, -moveY),
            "walk-right": Math.max(0, animX),
            "walk-left": Math.max(0, -animX),
            "idle": 0,
        };

        const total = Object.values(weights).reduce((a, b) => a + b, 0);

        if (total <= 0.0001) {
            weights.idle = 1;
            return weights;
        }

        for (const key in weights) {
            weights[key] /= total;
        }

        return weights;
    }

    computeRifleWeights(moveX = 0, moveY = 0, aiming = false) {
        const animX = moveY < 0 ? -moveX : moveX;
        const moving = moveX != 0 || moveY != 0;

        const weights = {
            //"walk-forward-rifle": Math.max(0, moveY),
            //"walk-backward-rifle": Math.max(0, -moveY),
            //"walk-right-rifle": Math.max(0, animX),
            //"walk-left-rifle": Math.max(0, -animX),
            //"idle-rifle": 0,
            "walk-rifle-aiming": 0,
            "idle-rifle-aiming": 0,
        };

        if (!moving) {
            if (aiming) weights["idle-rifle-aiming"] = 1;
        } else {
            if (aiming) weights["walk-rifle-aiming"] = 1;
        }

        return weights;
        
    }

    animateModel(moveX = 0, moveY = 0, inHand = "empty", aiming = false) {
        const lowerWeights = this.computeLowerWeights(moveX, moveY);
        this.skeletonAnimator.playWeighted("lower", lowerWeights);

        if (inHand === "rifle") {
            const upperWeights = this.computeRifleWeights(moveX, moveY, aiming);
            this.skeletonAnimator.playWeighted("upper", upperWeights);
            return;
        }
        this.skeletonAnimator.playWeighted("upper", lowerWeights);
    }

    update(dt = 0, params = {}) {
        this.animateModel(params.x ?? 0, params.y ?? 0, params.inHand, params.aiming);
        this.skeletonAnimator.update(dt);
    }
}