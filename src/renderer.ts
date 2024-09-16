import shader_src from "./shaders/common.wgsl"
import { Scene } from "./scene";
import { mat4, vec3 } from "gl-matrix";


const positions = new Float32Array([1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1]);
const normals = new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]);
const texcoords = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
const indices = new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23]);

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
    lightDirection: vec3;

    // Buffers
    vsUniformBuffer: GPUBuffer;
    fsUniformBuffer: GPUBuffer;
    vsUniformValues: Float32Array;
    fsUniformValues: Float32Array;
    positionBuffer: GPUBuffer;
    normalBuffer: GPUBuffer;
    texcoordBuffer: GPUBuffer;
    indicesBuffer: GPUBuffer;

    // Scene to render
    scene: Scene
    constructor(canvas: HTMLCanvasElement, scene: Scene) {
        this.canvas = canvas;
        this.scene = scene;
    }

    async Initialize() {

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

        this.positionBuffer = await this.createBuffer(this.device, positions, GPUBufferUsage.VERTEX);
        this.normalBuffer = await this.createBuffer(this.device, normals, GPUBufferUsage.VERTEX);
        this.texcoordBuffer = await this.createBuffer(this.device, texcoords, GPUBufferUsage.VERTEX);
        this.indicesBuffer = await this.createBuffer(this.device, indices, GPUBufferUsage.INDEX);

        const tex = this.device.createTexture({
            size: [2, 2],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING | 
                GPUTextureUsage.COPY_DST,
        });

        this.device.queue.writeTexture(
            { texture: tex },
            new Uint8Array([
                255, 255, 255, 255,
                255, 255, 255, 255,
                255, 255, 255, 255,
                255, 255, 255, 255,
            ]),
            { bytesPerRow: 8, rowsPerImage: 2 },
            { width: 2, height: 2 },
        );
        const sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
        });


        const vUniformBufferSize = 2 * 16 * 4;
        const fUniformBufferSize = 3 * 4;

        this.vsUniformBuffer = this.device.createBuffer({
            size: Math.max(16, vUniformBufferSize),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.fsUniformBuffer = this.device.createBuffer({
            size: Math.max(16, fUniformBufferSize),
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
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                }
            ]
        });

        this.bind_group = this.device.createBindGroup({
            layout: this.bind_group_layout,
            entries: [
                { binding: 0, resource: { buffer: this.vsUniformBuffer } },
                { binding: 1, resource: { buffer: this.fsUniformBuffer } },
                { binding: 2, resource: sampler },
                { binding: 3, resource: tex.createView() }
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
                        arrayStride: 3 * 4, // 3 float @ 4 bytes
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' }
                        ]
                    },
                    // normals
                    {
                        arrayStride: 3 * 4, // 3 floats, 4 bytes each
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: 'float32x3' },
                        ],
                    },
                    // texcoords
                    {
                        arrayStride: 2 * 4, // 2 float @ 4 bytes
                        attributes: [
                            { shaderLocation: 2, offset: 0, format: 'float32x2' }
                        ]
                    },
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
                topology: 'triangle-list',
                cullMode: 'back'
            }
        })

        
        this.vsUniformValues = new Float32Array(2 * 16);
        this.worldViewProjection = this.vsUniformValues.subarray(0, 16);
        this.worldInverseTranspose = this.vsUniformValues.subarray(16, 32);
        this.fsUniformValues = new Float32Array(3);
        this.lightDirection = this.fsUniformValues.subarray(0, 3);

        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: undefined,
                    resolveTarget: undefined,
                    clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }
            ]
        }

        this.render();
    }

    render = () => {
        let start = performance.now();

        this.scene.camera.update();

        const viewProjection = mat4.create();

        mat4.multiply(viewProjection, this.scene.camera.projectionMatrix, this.scene.camera.viewMatrix);
        const world = mat4.create(); // Should be unit matrix?
        mat4.transpose(this.worldInverseTranspose, mat4.invert(world, world));
        mat4.multiply(this.worldViewProjection, viewProjection, world);

        vec3.normalize(this.lightDirection, [1, 8, -10]);

        this.device.queue.writeBuffer(this.vsUniformBuffer, 0, this.vsUniformValues);
        this.device.queue.writeBuffer(this.fsUniformBuffer, 0, this.fsUniformValues);

        const colorTexture = this.context.getCurrentTexture();
        this.renderPassDescriptor.colorAttachments[0].view = colorTexture.createView();

        const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
        const passEncoder: GPURenderPassEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bind_group);
        passEncoder.setVertexBuffer(0, this.positionBuffer);
        passEncoder.setVertexBuffer(1, this.normalBuffer);
        passEncoder.setVertexBuffer(2, this.texcoordBuffer);
        passEncoder.setIndexBuffer(this.indicesBuffer, 'uint16');
        passEncoder.drawIndexed(indices.length);
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);

        this.device.queue.onSubmittedWorkDone().then(() => {
            let end = performance.now();
            const performanceLabel: HTMLElement = <HTMLElement>document.getElementById("performance");
            performanceLabel.innerText = ( 1000 / (end - start)).toLocaleString(
                undefined,
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );
        });

        requestAnimationFrame(this.render);
    }

    async createBuffer(device, data, usage): Promise<GPUBuffer> {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage,
            mappedAtCreation: true,
        });
        const dst = new data.constructor(buffer.getMappedRange());
        dst.set(data);
        buffer.unmap();
        return buffer;
    }
}