import { vec3 } from "gl-matrix";
import { ClothNode } from "./node";

export class Constraint {

    nodeA: ClothNode;
    nodeB: ClothNode;
    strength: number;
    restLength: number;

    constructor(node1: ClothNode, node2: ClothNode, strength: number) {
        this.nodeA = node1;
        this.nodeB = node2;
        this.strength = strength;

        let temp = vec3.create();
        vec3.sub(temp, this.nodeA.position, this.nodeB.position);
        this.restLength = vec3.len(temp)
    }

    update(dt: number) {
        let direction = vec3.create();
        let offset = vec3.create();

        vec3.sub(direction, this.nodeB.position, this.nodeA.position);

        let currLength = vec3.len(direction);
        let difference = this.restLength - currLength;

        let correctionPercentage = (difference / currLength) / 2;
        let timeScaledStrength = this.strength * dt;

        vec3.normalize(direction, direction);
        vec3.scale(offset, direction, correctionPercentage * this.strength);

        if (!this.nodeA.isStatic) {
            vec3.sub(this.nodeA.position, this.nodeA.position, offset);
        }
        
        if (!this.nodeB.isStatic) {
            vec3.add(this.nodeB.position, this.nodeB.position, offset);
        }
    }
}