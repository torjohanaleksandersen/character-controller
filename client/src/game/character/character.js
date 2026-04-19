import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { camera, inputHandler, world } from "../../main";
import { CharacterMotor } from "./motor";
import { Transform } from "../state/transform";


export class Character {
    constructor () {
        this.mesh = new THREE.Object3D();
        this.rigidBody = null;
        this.motor = null;
        this.animator = null;

        this.transform = new Transform();

        this.height = 1.2;
        this.radius = 0.35;
    }

    init() {
        return new Promise((resolve) => {

            const r = this.transform.position;
            const q = this.transform.quaternion;

            const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
                .setTranslation(r.x, r.y, r.z)
                .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });

            const rigidBody = world.createRigidBody(rbDesc);

            const colDesc = RAPIER.ColliderDesc.capsule(this.height / 2, this.radius);
            const collider = world.createCollider(colDesc, rigidBody);

            const controller = world.createCharacterController(0.01);

            this.motor = new CharacterMotor(rigidBody, controller, collider, {
                height: this.height,
                radius: this.radius
            })

            this.rigidBody = rigidBody;
            this.collider = collider;
            this.controller = controller;

            resolve();
        });
    }

    updateTransform() {
        const r = this.rigidBody.translation();
        this.transform.setPosition(r.x, r.y, r.z);

        this.mesh.position.copy(this.transform.position);
    }

    updateAnimator(dt, params) {
        if (!this.animator) return;

        this.animator.update(dt, params);

    }

    updateMotor(
        dt,
        inputX = 0,
        inputY = 0,
        jump = false,
        forward = new THREE.Vector3(0, 0, -1),
        right = new THREE.Vector3(1, 0, 0),
        yaw = 0
    ) {
    this.motor.update(dt, {
        inputX,
        inputY,
        jump,
        forward,
        right,
        yaw
    });
}
}