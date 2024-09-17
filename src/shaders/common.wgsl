struct VSUniforms {
  worldViewProjection: mat4x4f,
  worldInverseTranspose: mat4x4f,
};
@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VertexInput{
  @location(0) position: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
};

@vertex
fn vert_main(v: VertexInput) -> VertexOutput {
  var vsOut: VertexOutput;
  vsOut.position = vsUniforms.worldViewProjection * vec4f(v.position, 0.0, 1.0);
  return vsOut;
}

@fragment
fn frag_main(v: VertexOutput) -> @location(0) vec4f {
  var diffuseColor = vec4f(1.0, 1.0, 1.0, 1.0);
  return diffuseColor;
}