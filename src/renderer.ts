import shader_src from "./shaders/common.wgsl"
import { Scene } from "./scene";
import { mat4, vec3 } from "gl-matrix";


export class Renderer {

    canvas: HTMLCanvasElement

    // Device/Context objects
    adapter: GPUAdapter
    device: GPUDevice
    context: GPUCanvasContext
    format: GPUTextureFormat
    renderPassDescriptor: GPURenderPassDescriptor;

    //Assets
    color_buffer: GPUTexture
    color_buffer_view: GPUTextureView
    sampler: GPUSampler
    sceneParameters: GPUBuffer

    // Pipeline objects
    pipeline: GPURenderPipeline
    bind_group: GPUBindGroup
    bind_group_layout: GPUBindGroupLayout

    // Matrices
    worldViewProjection: mat4;
    worldInverseTranspose: mat4;

    // Buffers
    vsUniformBuffer: GPUBuffer;
    vsUniformValues: Float32Array;
    positionBuffer: GPUBuffer;

    // Scene to render
    scene: Scene

    constructor(canvas: HTMLCanvasElement, scene: Scene) {
        this.canvas = canvas;
        this.scene = scene;
    }

    async init() {

        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        this.device = <GPUDevice>await this.adapter?.requestDevice();

        this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

        this.positionBuffer = this.device.createBuffer({
            size: this.scene.simulation.nodes.length * 2 * 4, // n nodes w/ 3 floats @ 4 bytes
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        const vUniformBufferSize = 2 * 16 * 4; // 2 mats w/ 16 floats @ 4 bytes 

        this.vsUniformBuffer = this.device.createBuffer({
            size: Math.max(16, vUniformBufferSize),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });


        this.bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                }
            ]
        });

        this.bind_group = this.device.createBindGroup({
            layout: this.bind_group_layout,
            entries: [
                { binding: 0, resource: { buffer: this.vsUniformBuffer } },
            ]
        });

        const pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bind_group_layout]
        });
        const shaderModule = this.device.createShaderModule({ code: shader_src });

        this.pipeline = this.device.createRenderPipeline({
            label: 'asic lighting',
            layout: pipeline_layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vert_main',
                buffers: [
                    // position
                    {
                        arrayStride: 2 * 4, // 2 float @ 4 bytes
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x2' }
                        ]
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'frag_main',
                targets: [
                    { format: 'bgra8unorm' } // presentationFormat
                ]
            },
            primitive: {
                topology: 'point-list',
                cullMode: 'back'
            }
        })


        this.vsUniformValues = new Float32Array(2 * 16);
        this.worldViewProjection = this.vsUniformValues.subarray(0, 16);
        this.worldInverseTranspose = this.vsUniformValues.subarray(16, 32);

        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: undefined,
                    resolveTarget: undefined,
                    clearValue: { r: 0.12, g: 0.12, b: 0.13, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }
            ]
        }

        this.render();
    }

    render = () => {
        let start = performance.now();

        this.scene.update();

        const viewProjection = mat4.create();
        const positionBufferValues = Float32Array.from(
            [].concat(...this.scene.simulation.nodes.map(node => Array.from(node.position)))
        );

        mat4.multiply(viewProjection, this.scene.camera.projectionMatrix, this.scene.camera.viewMatrix);
        const world = mat4.create(); // Should be unit matrix?
        mat4.transpose(this.worldInverseTranspose, mat4.invert(world, world));
        mat4.multiply(this.worldViewProjection, viewProjection, world);

        this.device.queue.writeBuffer(this.positionBuffer, 0, positionBufferValues);
        this.device.queue.writeBuffer(this.vsUniformBuffer, 0, this.vsUniformValues);

        const colorTexture = this.context.getCurrentTexture();
        this.renderPassDescriptor.colorAttachments[0].view = colorTexture.createView();

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bind_group);
        passEncoder.setVertexBuffer(0, this.positionBuffer);
        passEncoder.draw(this.scene.simulation.nodes.length)
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);

        this.device.queue.onSubmittedWorkDone().then(() => {
            let end = performance.now();
            const fpsLabel: HTMLElement = <HTMLElement>document.getElementById("fps");
            fpsLabel.innerText = (1000 / (end - start)).toLocaleString(
                undefined,
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );
        });

        requestAnimationFrame(this.render);
    }
}