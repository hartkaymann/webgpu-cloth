import { mat4, vec2, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Scene } from "./scene";

export class InputHandler {

    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;

    isMiddleMouseDragging = false;
    isLeftMouseDragging = false;
    lastMouseX = 0;
    lastMouseY = 0;

    constructor(canvas: HTMLCanvasElement, camera: Camera, scene: Scene) {
        this.canvas = canvas;
        this.camera = camera;
        this.scene = scene;

        this.init();
    }

    init() {
        this.canvas.onmousedown = this.handleMouseDown.bind(this);
        this.canvas.onmousemove = this.handleMouseMove.bind(this);
        this.canvas.onmouseup = this.handleMouseUp.bind(this);
        this.canvas.onwheel = this.handleWheel.bind(this);
        this.canvas.oncontextmenu = (event: MouseEvent) => {
            event.preventDefault();
        }
    }

    updateLastMousePosition(event: MouseEvent) {
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    calculateDelta(event: MouseEvent): { deltaX: number, deltaY: number } {
        let deltaX: number, deltaY: number;

        if (document.pointerLockElement === this.canvas) {
            deltaX = event.movementX;
            deltaY = event.movementY;
        } else {
            deltaX = event.clientX - this.lastMouseX;
            deltaY = event.clientY - this.lastMouseY;
        }

        return { deltaX, deltaY };

    }

    handleMouseDown(event: MouseEvent) {
        event.preventDefault();

        if (event.button === 0) { // Left mouse button
            this.isLeftMouseDragging = true;
        }
        else if (event.button === 1) { //  Middle mouse button
            this.isMiddleMouseDragging = true;
            this.canvas.requestPointerLock();
        }

        this.updateLastMousePosition(event);
    }

    handleMouseMove(event: MouseEvent) {
        event.preventDefault();

        if (this.isLeftMouseDragging) {
            const ray = this.createRayFromMouse(event);
            const { deltaX, deltaY } = this.calculateDelta(event);

            this.scene.simulation.nodes.forEach(node => {
                if (this.intersectSphere(ray.origin, ray.direction, [node.position[0], node.position[1], 0], 1)) {
                    node.addForce(vec2.scale(vec2.create(),[deltaX, -deltaY], 1));
                }
            });            
        }

        if (this.isMiddleMouseDragging) {
            const { deltaX, deltaY } = this.calculateDelta(event);

            const orbitSpeed = 0.005;
            this.camera.orbit(deltaX * orbitSpeed, deltaY * orbitSpeed);
        }

        this.updateLastMousePosition(event);
    }

    handleMouseUp(event: MouseEvent) {
        event.preventDefault();

        if (event.button === 0) {
            this.isLeftMouseDragging = false;
        }
        else if (event.button === 1) {
            this.isMiddleMouseDragging = false;
            document.exitPointerLock();
        }
    }

    handleWheel(event: WheelEvent) {
        event.preventDefault();

        const zoomSpeed = 0.01;
        this.camera.zoom(event.deltaY * zoomSpeed);
    }

    getMouseNDC(event: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 2 - 1 // [-1, 1] range
        const y = -((event.clientY - rect.top) / rect.height * 2 - 1) // [-1, 1] range, inverted

        return { x, y }
    }

    createRayFromMouse(event: MouseEvent) {
        const ndc = this.getMouseNDC(event);
        const nearPoint: vec3 = [ndc.x, ndc.y, -1.0];
        const farPoint: vec3 = [ndc.x, ndc.y, 1.0];

        const invProjView = mat4.create();
        mat4.mul(invProjView, this.camera.projectionMatrix, this.camera.viewMatrix);
        mat4.invert(invProjView, invProjView);

        // Unproject points NDC to world
        const nearWorld = vec3.transformMat4(vec3.create(), nearPoint, invProjView);
        const farWorld = vec3.transformMat4(vec3.create(), farPoint, invProjView);

        const rayDirection = vec3.sub(vec3.create(), farWorld, nearWorld);
        vec3.normalize(rayDirection, rayDirection);

        return { origin: nearWorld, direction: rayDirection };
    }

    intersectSphere(origin: vec3, direction: vec3, position: vec3, radius: number): boolean{
        const oc = vec3.sub(vec3.create(), origin, position);
        const a = vec3.dot(direction, direction);
        const b = 2.0 * vec3.dot(oc, direction);
        const c = vec3.dot(oc, oc) - radius * radius;
        const discriminant = b * b - 4 * a * c;

        return discriminant > 0;
    }
}