uniform sampler2D read;

uniform vec3 bias;
uniform vec3 scale;

varying vec2 texCoord;

void main()
{
    gl_FragColor = vec4(bias + scale * texture2D(read, texCoord).xxx, 1.0);
    //gl_FragColor.a = 0.5;
}
