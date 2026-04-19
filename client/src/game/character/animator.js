import * as THREE from "three";
import { SkeletonAnimator } from "../animation/skeleton-animator";


export class Animator {

    constructor (mesh = new THREE.Object3D(), ) {
        this.skeletonAnimator = new SkeletonAnimator(mesh);
    }

    computeLowerWeights(moveX = 0, moveY = 0) {
        const weights = {
            "walk-forward": Math.max(0, moveY),
            "walk-backward": Math.max(0, -moveY),
            //"walk-right": Math.max(0, moveX),
            //"walk-left": Math.max(0, -moveX),
            "idle": 0,
            //"turn-left": 0,
            //"turn-right": 0
        }

        const total = Object.values(weights).reduce((a, b) => a + b, 0);

        if (total <= 0.0001) {
            weights["idle"] = 1;
            return weights;
        }

        for (const key in weights) {
            weights[key] /= total;
        }

        return weights;
    }

    computeUpperWeights(moveX = 0, moveY = 0) {
        const weights = {
            "walk-forward": Math.max(0, moveY),
            "walk-backward": Math.max(0, -moveY),
            //"walk-right": Math.max(0, moveX),
            //"walk-left": Math.max(0, -moveX),
            "idle": 0,
            //"turn-left": 0,
            //"turn-right": 0
        }

        const total = Object.values(weights).reduce((a, b) => a + b, 0);

        if (total <= 0.0001) {
            weights["idle"] = 1;
            return weights;
        }

        for (const key in weights) {
            weights[key] /= total;
        }

        return weights;
    }

    animateModel(moveX = 0, moveY = 0) {
        const moving = moveX !== 0 || moveY !== 0;

        const lowerWeights = this.computeLowerWeights(moveX, moveY);
        this.skeletonAnimator.playWeighted("lower", lowerWeights);

        const upperWeights = this.computeUpperWeights(moveX, moveY);
        this.skeletonAnimator.playWeighted("upper", upperWeights);
    }

    update(dt = 0, params = {}) {
        this.animateModel(params.x, params.y);

        this.skeletonAnimator.update(dt);
    }
}