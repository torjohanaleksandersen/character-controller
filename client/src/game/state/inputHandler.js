export class InputHandler {
    constructor(doc = document) {
        this.document = doc;

        this.keysDown = new Set();

        this.keyDownListeners = new Map();
        this.keyUpListeners = new Map();

        this.leftClickListeners = [];
        this.rightClickListeners = [];
        this.leftUpListeners = [];
        this.rightUpListeners = [];

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        this.handleContextMenu = (e) => e.preventDefault();

        this.document.addEventListener("keydown", this.handleKeyDown);
        this.document.addEventListener("keyup", this.handleKeyUp);
        this.document.addEventListener("mousedown", this.handleMouseDown);
        this.document.addEventListener("mouseup", this.handleMouseUp);
        this.document.addEventListener("contextmenu", this.handleContextMenu);
    }

    normalizeKey(key) {
        key = key.toLowerCase();
        if (key === " ") return "space";
        return key;
    }

    handleKeyDown(e) {
        const key = this.normalizeKey(e.key);

        if (this.keysDown.has(key)) return;

        this.keysDown.add(key);

        const listeners = this.keyDownListeners.get(key);
        if (listeners) {
            for (const callback of listeners) {
                callback(e);
            }
        }
    }

    handleKeyUp(e) {
        const key = this.normalizeKey(e.key);

        this.keysDown.delete(key);

        const listeners = this.keyUpListeners.get(key);
        if (listeners) {
            for (const callback of listeners) {
                callback(e);
            }
        }
    }

    handleMouseDown(e) {
        if (e.button === 0) {
            for (const cb of this.leftClickListeners) cb(e);
        }

        if (e.button === 2) {
            for (const cb of this.rightClickListeners) cb(e);
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) {
            for (const cb of this.leftUpListeners) cb(e);
        }

        if (e.button === 2) {
            for (const cb of this.rightUpListeners) cb(e);
        }
    }

    isDown(key) {
        return this.keysDown.has(this.normalizeKey(key));
    }

    onKeyDown(key, callback) {
        key = this.normalizeKey(key);

        if (!this.keyDownListeners.has(key)) {
            this.keyDownListeners.set(key, []);
        }

        this.keyDownListeners.get(key).push(callback);
    }

    onKeyUp(key, callback) {
        key = this.normalizeKey(key);

        if (!this.keyUpListeners.has(key)) {
            this.keyUpListeners.set(key, []);
        }

        this.keyUpListeners.get(key).push(callback);
    }

    onLeftClick(callback) {
        this.leftClickListeners.push(callback);
    }

    onRightClick(callback) {
        this.rightClickListeners.push(callback);
    }

    onLeftUp(callback) {
        this.leftUpListeners.push(callback);
    }

    onRightUp(callback) {
        this.rightUpListeners.push(callback);
    }

    destroy() {
        this.document.removeEventListener("keydown", this.handleKeyDown);
        this.document.removeEventListener("keyup", this.handleKeyUp);
        this.document.removeEventListener("mousedown", this.handleMouseDown);
        this.document.removeEventListener("mouseup", this.handleMouseUp);
        this.document.removeEventListener("contextmenu", this.handleContextMenu);
    }
}