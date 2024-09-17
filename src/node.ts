import { vec2 } from "gl-matrix";

export class ClothNode {

    position: vec2;
    prevPosition: vec2;
    gravity: vec2;
    velocity: vec2;
    acceleration: vec2;
    forceAccumulator: vec2;

    dt0: number;
    radius: number;
    invMass: number;
    isStatic: boolean;


    constructor(position: vec2, mass: number, radius = 1) {
        this.position = position;
        this.prevPosition = position;
        this.gravity = [0, 0];
        this.velocity = [0, 0];
        this.acceleration = [0, 0];
        this.forceAccumulator = [0, 0];

        this.dt0 = 1;
        this.radius = radius;
        if (mass > 0) {
            this.invMass = 1 / mass;
            this.isStatic = false;
        } else {
            this.invMass = 0;
            this.isStatic = true;
        }
    }

    update(dt: number) {
        if( !this.isStatic ) {
            // Apply gravity
            let f = vec2.create();
            vec2.scale(f, this.gravity, 1 / this.invMass);
            this.addForce(f);

            this.applyAcceleration();
            this.applyVerlet(dt);
        }
    }

    // x1 = x + (x - x0) * (dt / dt0) + a * dt * (dt + dt0) / 2
    applyVerlet(dt: number) {
        // (x - x0)
        vec2.sub(this.velocity, this.position, this.prevPosition);

        vec2.copy(this.prevPosition, this.position);

        // (dt / dt0)
        let correctedDeltaTime = dt / this.dt0;
        
        // (x - x0) * (dt / dt0)
        let timeCorrectedVelocity = vec2.create();
        vec2.scale(timeCorrectedVelocity, this.velocity, correctedDeltaTime);
        
        // a * dt * (dt + dt0) / 2
        let accelerationTerm = vec2.create();
        vec2.scale(accelerationTerm, this.acceleration, dt * (dt + this.dt0) / 2 );
        
        // Add terms to get x1
        vec2.add(timeCorrectedVelocity, timeCorrectedVelocity, accelerationTerm);
        vec2.add(this.position, this.position, timeCorrectedVelocity);

        this.dt0 = dt;

        vec2.zero(this.acceleration);
        vec2.zero(this.forceAccumulator);
    }

    applyAcceleration() {
        let acc = vec2.create();
        vec2.scale(acc, this.forceAccumulator, this.invMass);
        vec2.add(this.acceleration, this.acceleration, acc);
    }

    addForce(f: vec2) {
        vec2.add(this.forceAccumulator, this.forceAccumulator, f);
    }

    isInside(position: vec2): boolean {
        let diff = vec2.create();
        vec2.sub(diff, this.position, position);

        return vec2.len(diff) < this.radius; 
    }
} 