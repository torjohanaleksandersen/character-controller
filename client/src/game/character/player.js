import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js"
import { camera, inputHandler } from "../../main";
import { Character } from "./character";
import { Animator } from "./animator";
import { Transform } from "../state/transform";




const cameraForward = new THREE.Vector3(0, 0, -1);
const cameraRight = new THREE.Vector3(1, 0, 0);

const fbxLoader = new FBXLoader();

const bones = new Map();

export class Player extends Character {

    constructor () {
        super();

        this.keys = {};

        this.mouse = {
            left: false,
            right: false
        };

        //state
        this.aiming = false;
        this.inHand = "empty"

        this.transform.setPosition(0, 10, 0);

        this.currentLocalCameraTransform = new Transform();
        this.nextLocalCameraTransform = new Transform();
    }

    async init() {
        await super.init();

        const cameraControls = new PointerLockControls(camera, document.body);
        cameraControls.minPolarAngle = THREE.MathUtils.degToRad(20);   // look up limit
        cameraControls.maxPolarAngle = THREE.MathUtils.degToRad(170);  // look down limit
        inputHandler.onLeftClick(() => {cameraControls.lock()});

        const keys = ["w", "a", "s", "d", "space", "alt", "1", "2"];

        keys.forEach((key) => {
            inputHandler.onKeyDown(key, () => {
                this.keys[key] = true;
            });

            inputHandler.onKeyUp(key, () => {
                this.keys[key] = false;
            });
        });

        inputHandler.onRightClick(() => {
            this.mouse.right = true;
        })
        inputHandler.onRightUp(() => {
            this.mouse.right = false;
        })

        const mesh = await fbxLoader.loadAsync("/models/swat.fbx");
        mesh.traverse(obj => {
            if (obj.isMesh) {
                obj.frustumCulled = false;
            }
        });
        mesh.scale.setScalar(0.01);
        mesh.position.set(0, -this.height / 2 - this.radius, 0);
        this.animator = new Animator(mesh);

        bones.set("spine", mesh.getObjectByName("mixamorigSpine"));
        bones.set("spine1", mesh.getObjectByName("mixamorigSpine1"));
        bones.set("spine2", mesh.getObjectByName("mixamorigSpine2"));
        bones.set("hips", mesh.getObjectByName("mixamorigHips"));
        bones.set("rightHand", mesh.getObjectByName("mixamorigRightHand"));
        bones.set("leftHand", mesh.getObjectByName("mixamorigLeftHand"));
        bones.set("rightEye", mesh.getObjectByName("mixamorigRightEye"));
        bones.set("leftEye", mesh.getObjectByName("mixamorigLeftEye"));
        bones.set("head", mesh.getObjectByName("mixamorigHead"));
        bones.set("neck", mesh.getObjectByName("mixamorigNeck"));

        this.mesh.add(mesh);

        camera.lookAt(0, -2, 0.1);
    }

    computePlayerState() {
        if (this.keys["1"]) this.inHand = "empty";
        if (this.keys["2"]) this.inHand = "rifle";

        if (this.mouse.right && this.inHand == "rifle") this.aiming = true;
        else this.aiming = false;
    }

    correctBoneTransforms(moveX = 0, moveY = 0) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const camYaw = Math.atan2(camDir.x, camDir.z);
        this.mesh.rotation.y = camYaw;

        camDir.set(0, 0, 0);
        camera.getWorldDirection(camDir);

        camDir.normalize();
        const camPitch = Math.asin(camDir.y);

        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();

        if (!this.aiming) {
            const neck = bones.get("neck");
            neck.rotateX(-camPitch);
        }

        if (this.inHand !== "rifle") return;

        const spine = bones.get("spine");
        const spine1 = bones.get("spine1");
        const spine2 = bones.get("spine2");
        const rightHand = bones.get("rightHand");
        const leftHand = bones.get("leftHand");

        if (!spine || !spine1 || !spine2 || !rightHand || !leftHand || !spine.parent) return;

        // 1. Neutralize inherited pitch/roll, keep yaw
        const spineWorldQuat = new THREE.Quaternion();
        spine.getWorldQuaternion(spineWorldQuat);

        const spineWorldEuler = new THREE.Euler().setFromQuaternion(spineWorldQuat, "YXZ");
        const yaw = spineWorldEuler.y;

        const desiredWorldQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, yaw, 0, "YXZ")
        );

        const parentWorldQuat = new THREE.Quaternion();
        spine.parent.getWorldQuaternion(parentWorldQuat);

        const desiredLocalQuat = parentWorldQuat.clone().invert().multiply(desiredWorldQuat);
        spine.quaternion.copy(desiredLocalQuat);

        // 3. Approximate upper-body forward from hands
        const rightPos = new THREE.Vector3();
        const leftPos = new THREE.Vector3();
        rightHand.getWorldPosition(rightPos);
        leftHand.getWorldPosition(leftPos);

        const handSide = leftPos.sub(rightPos);
        handSide.y = 0;

        if (handSide.lengthSq() < 0.000001) return;

        handSide.normalize();


        const handForward = new THREE.Vector3(-handSide.z, 0, handSide.x).normalize();
        const handYaw = Math.atan2(handForward.x, handForward.z);

        const aimOffset = this.aiming ? THREE.MathUtils.degToRad(35) : 0;
        const correctedHandYaw = handYaw + aimOffset;

        let deltaYaw = camYaw - correctedHandYaw;
        deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));

        const baseRotation = this.aiming ? THREE.MathUtils.degToRad(-35) : 0;
        const totalRotation = baseRotation + deltaYaw;

        const yAxis = new THREE.Vector3(0, 1, 0);

        const yawWeights = [0.5, 0.3, 0.2];
        const pitchWeights = [0.15, 0.35, 0.5];

        if (!this.aiming) {
            let rest = 0;
            for (let i = 0; i < 3; i ++) {
                yawWeights[i] *= 0.5;
                rest += yawWeights[i];
            }

            const neck = bones.get("neck");
            neck.rotateY(rest * totalRotation);
        };

        const qYaw0 = new THREE.Quaternion().setFromAxisAngle(yAxis, totalRotation * yawWeights[0]);
        const qYaw1 = new THREE.Quaternion().setFromAxisAngle(yAxis, totalRotation * yawWeights[1]);
        const qYaw2 = new THREE.Quaternion().setFromAxisAngle(yAxis, totalRotation * yawWeights[2]);

        
        spine.quaternion.multiply(qYaw0);
        spine1.quaternion.multiply(qYaw1);
        spine2.quaternion.multiply(qYaw2);

        if (!this.aiming) return;

        function applyWorldAxisRotation(bone, worldAxis, angle) {
            const parentWorldQuat = new THREE.Quaternion();
            bone.parent.getWorldQuaternion(parentWorldQuat);

            const localAxis = worldAxis.clone().applyQuaternion(parentWorldQuat.clone().invert()).normalize();

            const q = new THREE.Quaternion().setFromAxisAngle(localAxis, angle);
            bone.quaternion.multiply(q);
        }

        applyWorldAxisRotation(spine, camRight, camPitch * pitchWeights[0]);
        applyWorldAxisRotation(spine1, camRight, camPitch * pitchWeights[1]);
        applyWorldAxisRotation(spine2, camRight, camPitch * pitchWeights[2]);
    }

    setCameraTransform() {
        camera.position.copy(this.transform.position).add(new THREE.Vector3(0, 1, -2));

        return;
        
        

        const rightEye = bones.get("rightEye");
        const leftEye = bones.get("leftEye");

        const pos = new THREE.Vector3();
        const rightPos = new THREE.Vector3();
        const leftPos = new THREE.Vector3();
        const quat = new THREE.Quaternion();

        rightEye.getWorldPosition(rightPos);
        leftEye.getWorldPosition(leftPos);

        pos.copy(leftPos).add(rightPos).multiplyScalar(0.5);
        camera.getWorldQuaternion(quat);

        const offset = new THREE.Vector3(0, 0, 0);
        //if (this.aiming) offset.set(0, 0, -0.03);

        offset.applyQuaternion(quat);

        this.nextLocalCameraTransform.copyPosition(pos.add(offset));
        this.nextLocalCameraTransform.copyQuaternion(quat);

        this.currentLocalCameraTransform.interpolateToTransform(this.nextLocalCameraTransform, 1.0);
        this.currentLocalCameraTransform.copyQuaternion(quat);

        camera.position.copy(this.currentLocalCameraTransform.position);
    }


    /* UPDATE METHODS */

    update(dt) {
        const [x, y, jump] = this.getMotorInputs();
        const cameraBasis = this.getCameraBasis();

        this.updateMotor(dt, x, y, jump, cameraBasis.forward, cameraBasis.right, cameraBasis.yaw);
        this.updateTransform();

        this.computePlayerState();

        this.updateAnimator(dt, {x, y, inHand: this.inHand, aiming: this.aiming});

        this.correctBoneTransforms(x, y);
        this.setCameraTransform();
    }






    /* GET METHODS */

    getMotorInputs() {
        let x = 0;
        let y = 0;

        if (this.keys.d) x += 1;
        if (this.keys.a) x -= 1;
        if (this.keys.w) y += 1;
        if (this.keys.s) y -= 1;

        const len = Math.hypot(x, y); 
        if (len > 0) {
            x /= len;
            y /= len;
        }

        const jump = this.keys.space;

        return [x, y, jump];
    }

    getCameraBasis() {
        camera.getWorldDirection(cameraForward);

        cameraForward.y = 0;

        if (cameraForward.lengthSq() < 0.000001) {
            cameraForward.set(0, 0, 1);
        } else {
            cameraForward.normalize();
        }

        cameraRight
            .crossVectors(cameraForward, new THREE.Vector3(0, 1, 0))
            .normalize();

        const yaw = Math.atan2(cameraForward.x, cameraForward.z);

        return {
            yaw: yaw,
            forward: cameraForward,
            right: cameraRight
        };
    }
}