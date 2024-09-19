import { vec3 } from "gl-matrix";
import { Constraint } from "./constraint";
import { ClothNode } from "./node";

// Based on Marcel Kießlich's 2D Cloth Simulation tutorial
// https://gitlab.com/Marcel.K/tutorials/-/tree/main/2D%20Cloth%20Simulation
export class Simulation {
    nodes: ClothNode[];
    constraints: Constraint[];
    gravity: vec3;

    constructor() {
        this.nodes = [];
        this.constraints = [];
        this.gravity = [0, -9.81, -10]
    }

    createNode(position: vec3 | Float32Array, mass = 0.01) : ClothNode {
        let node = new ClothNode(position, mass);
        this.nodes.push(node);
        return node;
    }

    createConstraint(node1: ClothNode, node2: ClothNode, strength = 0.4) : Constraint{
        let constraint = new Constraint(node1, node2, strength);
        this.constraints.push(constraint);
        return constraint;
    }

    update(dt: number) {
        for( let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].gravity = this.gravity;
            this.nodes[i].update(dt);
        }

        for(let iteration = 0; iteration < 10; iteration++) {
            for(let i = 0; i < this.constraints.length; i++) {
                this.constraints[i].update(dt);
            }
        }
    }
}