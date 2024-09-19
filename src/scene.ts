import { vec2, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Simulation } from "./simulation";
import { ClothNode } from "./node";

export class Scene {

    camera: Camera

    simulation: Simulation;
    clothResolution: number;
    clothWidth: number;
    clothHeight: number;

    prevTime: number;

    constructor(camera: Camera) {
        this.camera = camera;

        this.simulation = new Simulation();
        this.clothResolution = 16;
        this.clothWidth = 8;
        this.clothHeight = 6;

        this.prevTime = performance.now();

        this.init();
    }

    init() {
        // Create nodes
        let strideX = this.clothWidth / (this.clothResolution - 1);
        let strideY = - this.clothHeight / (this.clothResolution - 1);
        let nodes2d: ClothNode[][] = [];
        for (let y = 0; y < this.clothResolution; y++) {
            nodes2d[y] = [];
            for (let x = 0; x < this.clothResolution; x++) {
                let offset: vec2 = [-this.clothWidth / 2, this.clothHeight / 2];
                let position: vec3 = [x * strideX + offset[0], y * strideY + offset[1], 0];
                nodes2d[y][x] = this.simulation.createNode(position);

                if (x%4 == 0 && y == 0 || x == this.clothResolution - 1 && y == 0) {
                    nodes2d[y][x].isStatic = true;
                }
            }
        }

        // Create constraints
        for (let y = 0; y < this.clothResolution; y++) {
            for (let x = 0; x < this.clothResolution; x++) {
                if (x < this.clothResolution - 1) {
                    this.simulation.createConstraint(nodes2d[y][x], nodes2d[y][x + 1]);
                }
                if (y < this.clothResolution - 1) {
                    this.simulation.createConstraint(nodes2d[y][x], nodes2d[y + 1][x]);
                }
            }
        }
    }

    update() {
        const currTime = performance.now();
        const deltaTime = (currTime - this.prevTime) / 1000;
        this.prevTime = currTime;

        this.simulation.update(deltaTime);

        const dtLabel: HTMLElement = <HTMLElement>document.getElementById("deltatime");
        dtLabel.innerText = deltaTime.toLocaleString(
            undefined,
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4
            }
        );
    }
}