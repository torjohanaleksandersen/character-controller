import * as THREE from "three";



export class Transform {
    constructor () {
        this.position = new THREE.Vector3(0, 0, 0);
        this.quaternion = new THREE.Quaternion(0, 0, 0, 1);
        this.scale = new THREE.Vector3(1, 1, 1);

        this.velocity = new THREE.Vector3(0, 0, 0);
    }

    setPosition(x = 0, y = 0, z = 0) {
        this.position.set(x, y, z);
        return this;
    }

    setQuaternion(x = 0, y = 0, z = 0, w = 1) {
        this.quaternion.set(x, y, z, w);
        return this;
    }

    setScale(x = 1, y = 1, z = 1) {
        this.scale.set(x, y, z);
        return this;
    }

    copyPosition(r = new THREE.Vector3(0, 0, 0)) {
        this.position.copy(r);
        return this;
    }

    copyQuaternion(q = new THREE.Quaternion(0, 0, 0, 1)) {
        this.quaternion.copy(q);
        return this;
    }

    copyScale(s = new THREE.Vector3(1, 1, 1)) {
        this.scale.copy(s);
        return this;
    }

    getEulerRotation() {
        return new THREE.Euler().setFromQuaternion(this.quaternion);
    }

    interpolateToTransform(transform = new Transform(), alpha = 0.1) {
        this.position.lerp(transform.position, alpha);
        this.quaternion.slerp(transform.quaternion, alpha);
        this.scale.lerp(transform.scale, alpha);
        this.velocity.lerp(transform.velocity, alpha);

        return this;
    }

    interpolateAttribute(attr = "position", val = null, alpha = 0.1) {
        if (!val) return;
        switch (attr) {
            case "position":
                this.position.lerp(val, alpha);
                break;
        }
    }
}