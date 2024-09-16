import { vec3, mat4 } from "gl-matrix"

export class Camera {

    position: vec3;
    front: vec3;
    right: vec3;
    up: vec3;
    center: vec3;
    worldUp: vec3;

    fov: number;
    aspect: number;
    near: number;
    far: number;
    yaw: number;
    pitch: number;

    target: vec3;

    projectionMatrix: mat4;
    viewMatrix: mat4;

    constructor(position: number[], up: number[], center: number[], fov: number, aspect: number, near: number, far: number) {
        this.position = new Float32Array(position);
        this.worldUp = new Float32Array(up)
        this.center = new Float32Array(center);
        this.target = new Float32Array(center);
        this.front = [0, 0, 0];
        this.right = [0, 0, 0];
        this.up = [0, 0, 0];
        
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.yaw = 0;
        this.pitch = 0;
        
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        
        this.update();
    }

    update() {
        this.recalculate_vectors();
        this.recalculate_matrices();
    }
    
    recalculate_vectors() {
        let temp = vec3.create();;

        // Update front
        temp[0] = Math.cos(this.degToRad(this.yaw)) * Math.cos(this.degToRad(this.pitch));
        temp[1] = Math.sin(this.degToRad(this.pitch));
        temp[2] = Math.sin(this.degToRad(this.yaw)) * Math.cos(this.degToRad(this.pitch));
        vec3.normalize(this.front, temp);
        
        // Update right
        vec3.cross(temp, this.front, this.worldUp);
        vec3.normalize(this.right, temp);

        // Update up
        vec3.cross(temp, this.right, this.front);
        vec3.normalize(this.up, temp);
    }    

    recalculate_matrices() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far);
    }
    
    degToRad(deg: number) : number {
        return deg * (Math.PI / 180 );
    }
}