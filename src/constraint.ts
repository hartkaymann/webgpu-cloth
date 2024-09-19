import { vec2 } from "gl-matrix";
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

        let temp = vec2.create();
        vec2.sub(temp, this.nodeA.position, this.nodeB.position);
        this.restLength = vec2.len(temp)
    }

    update(dt: number) {
        let direction = vec2.create();
        let offset = vec2.create();

        vec2.sub(direction, this.nodeB.position, this.nodeA.position);

        let currLength = vec2.len(direction);
        let difference = this.restLength - currLength;

        let correctionPercentage = (difference / currLength) / 2;
        let timeScaledStrength = this.strength * dt;

        vec2.scale(offset, direction, correctionPercentage * this.strength);
        vec2.normalize(direction, direction);

        if (!this.nodeA.isStatic) {
            vec2.sub(this.nodeA.position, this.nodeA.position, offset);
        }
        
        if (!this.nodeB.isStatic) {
            vec2.add(this.nodeB.position, this.nodeB.position, offset);
        }
    }
}