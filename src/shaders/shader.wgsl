@group(0) @binding(0) var screen_sampler: sampler;
@group(0) @binding(1) var color_buffer: texture_2d<f32>;

struct VertexOutput{
    @builtin(position) Position: vec4f,
    @location(0) TexCoord: vec2f,
}

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
    let positions = array<vec2f, 6>(
        vec2f(1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(-1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0),
        vec2f(-1.0, 1.0)
    );

    let texCoords = array<vec2f, 6>(
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 0.0),
    );

    var output: VertexOutput;
    output.Position = vec4f(positions[VertexIndex], 0.0, 1.0);
    output.TexCoord = texCoords[VertexIndex];
    return output;
}

@fragment
fn frag_main(@location(0) TexCoord: vec2f) -> @location(0) vec4f {
    return textureSample(color_buffer, screen_sampler, TexCoord);
}