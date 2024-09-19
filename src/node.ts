import { vec3 } from "gl-matrix";

export class ClothNode {

    position: vec3;
    prevPosition: vec3;
    gravity: vec3;
    velocity: vec3;
    acceleration: vec3;
    forceAccumulator: vec3;

    dt0: number;
    invMass: number;
    isStatic: boolean;


    constructor(position: vec3, mass: number) {
        this.position = position;
        this.prevPosition = position;
        this.gravity = [0, 0, 0];
        this.velocity = [0, 0, 0];
        this.acceleration = [0, 0, 0];
        this.forceAccumulator = [0, 0, 0];

        this.dt0 = 1;
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
            this.addForce(vec3.scale(vec3.create(), this.gravity, 1 / this.invMass));

            this.applyAcceleration();
            this.applyVerlet(dt);
        }
    }

    // x1 = x + (x - x0) * (dt / dt0) + a * dt * (dt + dt0) / 2
    applyVerlet(dt: number) {
        // (x - x0)
        vec3.sub(this.velocity, this.position, this.prevPosition);

        vec3.copy(this.prevPosition, this.position);

        // (dt / dt0)
        let correctedDeltaTime = dt / this.dt0;
        
        // (x - x0) * (dt / dt0)
        let timeCorrectedVelocity = vec3.create();
        vec3.scale(timeCorrectedVelocity, this.velocity, correctedDeltaTime);
        
        // a * dt * (dt + dt0) / 2
        let accelerationTerm = vec3.create();
        vec3.scale(accelerationTerm, this.acceleration, dt * (dt + this.dt0) / 2 );
        
        // Add terms to get x1
        vec3.add(timeCorrectedVelocity, timeCorrectedVelocity, accelerationTerm);
        vec3.add(this.position, this.position, timeCorrectedVelocity);

        this.dt0 = dt;

        vec3.zero(this.acceleration);
        vec3.zero(this.forceAccumulator);
    }

    applyAcceleration() {
        let acc = vec3.create();
        vec3.scale(acc, this.forceAccumulator, this.invMass);
        vec3.add(this.acceleration, this.acceleration, acc);
    }

    addForce(f: vec3) {
        vec3.add(this.forceAccumulator, this.forceAccumulator, f);
    }
} 