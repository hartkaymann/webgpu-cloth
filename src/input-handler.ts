import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Scene } from "./scene";
import { Raycaster } from "./raycaster";

export class InputHandler {

    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
    raycaster: Raycaster;

    isMiddleMouseDragging = false;
    isLeftMouseDragging = false;
    lastMouseX = 0;
    lastMouseY = 0;

    constructor(canvas: HTMLCanvasElement, camera: Camera, scene: Scene) {
        this.canvas = canvas;
        this.camera = camera;
        this.scene = scene;

        this.raycaster = new Raycaster(canvas, camera);

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
            deltaX = -event.movementX;
            deltaY = -event.movementY;
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
            const ray = this.raycaster.updateRay(event);

            // Check ray intersection for each node and apply force if 
            this.scene.simulation.nodes.forEach(node => {
                if (this.raycaster.intersectSphere(ray.origin, ray.direction, node.position, 0.1)) {
                    node.addForce(vec3.normalize(vec3.create(), this.raycaster.deltaRay.direction));
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

}