import { vec3 } from "gl-matrix";
import { ClothNode } from "./node";

export class Constraint {

    nodeA: ClothNode;
    nodeB: ClothNode;
    strength: number; // N / m
    restLength: number;

    constructor(node1: ClothNode, node2: ClothNode, strength: number) {
        this.nodeA = node1;
        this.nodeB = node2;
        this.strength = strength;

        this.restLength = vec3.len(vec3.sub(vec3.create(), this.nodeA.position, this.nodeB.position));
    }

    update() {
        let direction = vec3.create();
        let offset = vec3.create();

        vec3.sub(direction, this.nodeB.position, this.nodeA.position);
        let currLength = vec3.len(direction);
        let difference = this.restLength - currLength;

        let correctionPercentage = (difference / currLength) / 2;

        vec3.normalize(direction, direction);
        vec3.scale(offset, direction, correctionPercentage * this.strength);

        if (!this.nodeA.isStatic) {
            this.nodeA.addForce(vec3.scale(vec3.create(), offset, -1));
        }

        if (!this.nodeB.isStatic) {
            this.nodeB.addForce(offset);
        }
    }
}