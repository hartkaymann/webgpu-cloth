import { Scene } from "./scene";
import { Renderer } from "./renderer";
import { Camera } from "./camera";

const canvas : HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("gfx-main");

const camera: Camera = new Camera(
    [1, 4, 6], 
    [0, 1, 0], 
    [1, 0, 0], 
    45, 
    canvas.width / canvas.height, 
    0.1, 
    100);
const scene: Scene = new Scene(camera);

const renderer = new Renderer(canvas, scene);

renderer.Initialize();
