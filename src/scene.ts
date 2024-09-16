import { vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Node } from "./node";

export class Scene {

    camera: Camera

    nodePositions: vec3[] = [
        [0, 0, 0], [1, 0, 0], [2, 0, 0],
        [0, 1, 0], [1, 1, 0], [2, 1, 0],
        [0, 2, 0], [1, 2, 0], [2, 2, 0]
    ];
    nodes: Node[] = [
        { index: 0, neighbours: [1, 3] },
        { index: 1, neighbours: [0, 2, 4] },
        { index: 2, neighbours: [1, 5] },
        { index: 3, neighbours: [0, 4, 6] },
        { index: 4, neighbours: [1, 3, 5, 7] },
        { index: 5, neighbours: [2, 4, 8] },
        { index: 6, neighbours: [3, 7] },
        { index: 7, neighbours: [4, 6, 8] },
        { index: 8, neighbours: [7, 5] },
    ];

    constructor(camera: Camera) {
        this.camera = camera;
    }

    update() {
        
    }
}