import { Scene } from "./scene";
import { Renderer } from "./renderer";
import { Camera } from "./camera";
import { event } from "jquery";

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const canvas : HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("gfx-main");

const camera: Camera = new Camera(
    0, 
    Math.PI / 2, 
    10, 
    [0, 1, 0], 
    [0, 0, 0], 
    45, 
    canvas.width / canvas.height, 
    0.1, 
    100);
const scene: Scene = new Scene(camera);

const renderer = new Renderer(canvas, scene);

renderer.init();

canvas.onmousedown = (event: MouseEvent) => {
    if(event.button === 1) { // Middle mouse button
        isDragging = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        canvas.requestPointerLock();
    }
} 

canvas.onmousemove = (event: MouseEvent) => {
    if(isDragging) {
        const deltaX = -event.movementX;
        const deltaY = -event.movementY;

        const orbitSpeed = 0.005;
        camera.orbit(deltaX * orbitSpeed, deltaY * orbitSpeed);

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
}

canvas.onmouseup = (event: MouseEvent) => {
    if(event.button === 1) {
        isDragging = false;
        document.exitPointerLock();
    }
}

canvas.onwheel = (event: WheelEvent) => {
    const zoomSpeed = 0.01;
    camera.zoom(event.deltaY * zoomSpeed);
}

canvas.oncontextmenu = (event: MouseEvent) => {
    event.preventDefault();
}