import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js"
import { camera, inputHandler } from "../../main";
import { Character } from "./character";
import { Animator } from "./animator";




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
        mesh.scale.setScalar(0.01);
        mesh.position.set(0, -this.height / 2 - this.radius, 0);
        this.animator = new Animator(mesh);

        bones.set("spine", mesh.getObjectByName("mixamorigSpine"));
        bones.set("spine1", mesh.getObjectByName("mixamorigSpine1"));
        bones.set("spine2", mesh.getObjectByName("mixamorigSpine2"));

        this.mesh.add(mesh);

        camera.lookAt(0, -2, 0.1);
    }

    computePlayerState() {
        if (this.mouse.right) this.aiming = true;
        else this.aiming = false;

        if (this.keys["1"]) this.inHand = "empty";
        if (this.keys["2"]) this.inHand = "rifle";
    }





    correctBoneTransforms(moveX = 0, moveY = 0) {
        if (this.inHand === "empty" || !this.aiming) return;

        const baseRotation = THREE.MathUtils.degToRad(-30);

        const walkRotation =
            moveX > 0.001 ? Math.PI / 2 :
            moveX < -0.001 ?  -Math.PI / 2 :
            0;

        const totalRotation = baseRotation + walkRotation;




        bones.get("spine").rotateY(totalRotation * 0.33);
        bones.get("spine1").rotateY(totalRotation * 0.33);
        bones.get("spine2").rotateY(totalRotation * 0.33);
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

        camera.position.copy(this.transform.position.clone().add(new THREE.Vector3(0, 2, -1)));
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