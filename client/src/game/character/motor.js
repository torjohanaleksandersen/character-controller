import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { camera, inputHandler, world } from "../../main";




function moveTowards(current, target, maxDelta) {
    const delta = target - current;

    if (Math.abs(delta) <= maxDelta) return target;

    return current + Math.sign(delta) * maxDelta;
}


const moveDirection = new THREE.Vector3();

export class CharacterMotor {
    constructor (rigidBody, controller, collider, params = {}) {
        this.rigidBody = rigidBody;
        this.controller = controller;
        this.collider = collider;
        for (const key in params) {
            this[key] = params[key];
        }

        this.moveVelocity = new THREE.Vector3();
        this.desiredVelocity = new THREE.Vector3();

        this.maxSpeed = 3.0;
        this.acceleration = 13.0;
        this.deceleration = 15.0;

        this.verticalVelocity = 0;
        this.gravity = world.gravity.y;
        this.jumpSpeed = 3.5;

        this.inputX = 0;
        this.inputY = 0;
        this.grounded = false;
        this.jump = false;
    }

    computeDesiredVelocity() {

        moveDirection.set(0, 0, 0);

        if (this.inputY !== 0) {
            moveDirection.addScaledVector(this.forward, this.inputY);
        }

        if (this.inputX !== 0) {
            moveDirection.addScaledVector(this.right, this.inputX);
        }

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
        }

        this.desiredVelocity.copy(moveDirection).multiplyScalar(this.maxSpeed);
    }

    updateVelocity(dt) {
        const acc = this.grounded ? this.acceleration : this.acceleration * 0.05;
        const dec = this.grounded ? this.deceleration : this.deceleration * 0.05;

        const hasInput = Math.abs(this.inputX) > 0.0001 || Math.abs(this.inputY) > 0.0001;
        const rate = hasInput ? acc : dec;
        const maxDelta = rate * dt;

        this.moveVelocity.x = moveTowards(this.moveVelocity.x, this.desiredVelocity.x, maxDelta);
        this.moveVelocity.z = moveTowards(this.moveVelocity.z, this.desiredVelocity.z, maxDelta);
    }

    buildDesiredTranslation(dt) {
        return {
            x: this.moveVelocity.x * dt,
            y: this.verticalVelocity * dt,
            z: this.moveVelocity.z * dt
        };
    }

    move(dt) {
        this.computeDesiredVelocity();
        this.updateVelocity(dt);

        if (!this.grounded) {
            this.verticalVelocity += this.gravity * dt;
        } else if (this.verticalVelocity < 0) {
            this.verticalVelocity = 0;
        }

        if (this.jump && this.grounded) {
            this.verticalVelocity = this.jumpSpeed;
            this.grounded = false;
        }

        const desiredMove = this.buildDesiredTranslation(dt);

        this.controller.computeColliderMovement(
            this.collider,
            desiredMove
        );

        const corrected = this.controller.computedMovement();
        const current = this.rigidBody.translation();

        this.rigidBody.setNextKinematicTranslation({
            x: current.x + corrected.x,
            y: current.y + corrected.y,
            z: current.z + corrected.z
        });

        if (this.grounded && this.verticalVelocity < 0) {
            this.verticalVelocity = 0;
        }
    }

    update(dt = 0, input = {}) {
        this.inputX = input.inputX;
        this.inputY = input.inputY;
        this.grounded = this.isGrounded();
        this.jump = input.jump;
        this.forward = input.forward;
        this.right = input.right;
        this.yaw = input.yaw;

        this.move(dt);
    }

    isGrounded() {
        const origin = this.rigidBody.translation();

        const rayOrigin = {
            x: origin.x,
            y: origin.y - (this.height / 2) - this.radius - 0.01,
            z: origin.z
        };

        const rayDir = { x: 0, y: -1, z: 0 };
        const maxToi = 0.05;
        const solid = true;

        const hit = world.castRay(
            new RAPIER.Ray(rayOrigin, rayDir),
            maxToi,
            solid
        );

        return hit !== null;
    }
}
