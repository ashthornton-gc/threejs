import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import { TimelineLite } from 'gsap';

const lostIntro = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls,
        group,
        timeline,
        font,
        textGeom, textMat, text,
        light,
        material_depth,
        inputWrap, input, execute;

    let postprocessing = {};
    let bokeh_params = {
        shaderFocus	: false,
        fstop 		: 2.6 * 2,
        maxblur 	: 3.0,
        showFocus 	: false,
        focalDepth 	: 6.0,
        manualdof 	: false,
        vignetting 	: false,
        depthblur 	: false,

        threshold 	: 0.5,
        gain 		: 0.1,
        bias 		: 0.5,
        fringe		: 0.7,

        focalLength	: 35,
        noise		: false,
        pentagon	: false,

        dithering	: 0.00001
    };

    function init() {

        inputWrap = document.getElementById('input-wrap');
        input = document.getElementById('text');
        execute = document.getElementById('execute');

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x000000 );
        scene.fog = new THREE.Fog( 0x000000, 0.1, 100);

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 100);
        camera.position.set(0, 0, 100);
        camera.focus = 0.1;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        //controls = new OrbitControls( camera );

        material_depth = new THREE.MeshDepthMaterial();

        group = new THREE.Group();

        light = new THREE.DirectionalLight( 0xFFFFFF, 0.75 );
        light.castShadow = true;
        light.position.set( -2, 25, 10);
        group.add( light );

        let loader = new THREE.FontLoader();

        loader.load( 'font/futura.json', function ( response ) {

            font = response;
            createText();

        } );

        initPostProcessing();

        // Setting up the DoF parameters to bokeh shader
        for( let e in bokeh_params ) {
            if( e in postprocessing.bokeh_uniforms )
                postprocessing.bokeh_uniforms[e].value = bokeh_params[e];
        }
        postprocessing.enabled = true;
        postprocessing.bokeh_uniforms["znear"].value 	= camera.near;
        postprocessing.bokeh_uniforms["zfar"].value 	= camera.far;
        camera.setFocalLength( bokeh_params.focalLength );

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor( 0x000000, 1.0 );
        renderer.setSize(renderWidth, renderHeight);
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.gammaInput  = true;
        renderer.gammaOutput = true;

        document.body.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);

        input.addEventListener('keydown', function(event) {
            if (event.keyCode === 13) {
                createText( input.value );
                return true;
            }
        }, false);

        execute.addEventListener('click', function() {
            console.log(input.value);
            createText( input.value );
        }, false);

        input.focus();

    }

    function initPostProcessing() {
        postprocessing.scene  = new THREE.Scene();
        postprocessing.camera = new THREE.OrthographicCamera( -window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, -10, 10 );

        postprocessing.scene.add( postprocessing.camera );

        /* Rendering to color and depth textures */
        var params = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format   : THREE.RGBFormat
        };

        /* Preparing the frame buffers to be rendered to */
        postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, params );
        postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, params );

        var bokeh_shader = THREE.BokehShader;
        postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );
        postprocessing.bokeh_uniforms["tColor"].value = postprocessing.rtTextureColor;
        postprocessing.bokeh_uniforms["tDepth"].value = postprocessing.rtTextureDepth;

        postprocessing.bokeh_uniforms["textureWidth" ].value = window.innerWidth;
        postprocessing.bokeh_uniforms["textureHeight"].value = window.innerHeight;

        postprocessing.materialBokeh = new THREE.ShaderMaterial( {
            uniforms 		: postprocessing.bokeh_uniforms,
            vertexShader 	: bokeh_shader.vertexShader,
            fragmentShader 	: bokeh_shader.fragmentShader,
            defines: {
                RINGS	: 2,
                SAMPLES	: 8
            }
        } );

        postprocessing.quad = new THREE.Mesh( new THREE.PlaneGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
        postprocessing.scene.add( postprocessing.quad );
    }

    function onWindowResize() {

        renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(renderWidth, renderHeight);
    }

    function createText( textVal = 'LOST' ) {

        group.remove( text );

        if( textVal === '' ) {
            textVal = '4 8 15 16 23 42';
        }
        textVal = textVal.split('').join(' ');

        textGeom = new THREE.TextGeometry( textVal, {
            font: font,
            size: 5,
            height: 0.5,
            curveSegments: 100,
        } );

        textGeom.center();

        textMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        text = new THREE.Mesh( textGeom, textMat );
        text.receiveShadow = true;
        text.position.set( 0, 0, 0 );
        group.add( text );

        scene.add( group );

        if( typeof timeline !== 'undefined' ) {
            timeline.kill();
        }

        createAnimation();

    }

    function createAnimation() {

        timeline = new TimelineLite();

        timeline.fromTo( group.position, 6, {
            z: 0
        }, {
            z: 70,
            ease: 'Linear.easeIn'
        }, 0);

        timeline.fromTo( group.rotation, 10, {
            z: 0.6,
            y: -1.2,
            x: -0.5
        }, {
            z: -0.4,
            y: -0.2,
            x: -0.3,
            ease: 'Linear.easeInOut'
        }, 0);

        timeline.to( group.position, 4, {
            z: 101,
            ease: 'Linear.easeIn'
        }, 5.7);

        timeline.fromTo( group.position, 6, {
            y: 0,
            x: 0
        }, {
            y: -2,
            x: -1,
            ease: 'Power2.easeInOut'
        }, 5.7);

    }

    function render() {

        //controls.update();

        renderer.clear();
        scene.overrideMaterial = null;
        renderer.render( scene, camera, postprocessing.rtTextureColor, true );

        scene.overrideMaterial = material_depth;
        renderer.render( scene, camera, postprocessing.rtTextureDepth, true );

        /* Then render them using the depth of field postprocessing scene */
        renderer.render( postprocessing.scene, postprocessing.camera );

    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    /**
     * @author zz85 / https://github.com/zz85 | twitter.com/blurspline
     *
     * Depth-of-field shader with bokeh
     * ported from GLSL shader by Martins Upitis
     * http://blenderartists.org/forum/showthread.php?237488-GLSL-depth-of-field-with-bokeh-v2-4-(update)
     *
     * Requires #define RINGS and SAMPLES integers
     */

    THREE.BokehShader = {

        uniforms: {

            "textureWidth":  { type: "f", value: 1.0 },
            "textureHeight":  { type: "f", value: 1.0 },

            "focalDepth":   { type: "f", value: 1.0 },
            "focalLength":   { type: "f", value: 24.0 },
            "fstop": { type: "f", value: 0.9 },

            "tColor":   { type: "t", value: null },
            "tDepth":   { type: "t", value: null },

            "maxblur":  { type: "f", value: 1.0 },

            "showFocus":   { type: "i", value: 0 },
            "manualdof":   { type: "i", value: 0 },
            "vignetting":   { type: "i", value: 0 },
            "depthblur":   { type: "i", value: 0 },

            "threshold":  { type: "f", value: 0.5 },
            "gain":  { type: "f", value: 2.0 },
            "bias":  { type: "f", value: 0.5 },
            "fringe":  { type: "f", value: 0.7 },

            "znear":  { type: "f", value: 0.1 },
            "zfar":  { type: "f", value: 100 },

            "noise":  { type: "i", value: 1 },
            "dithering":  { type: "f", value: 0.0001 },
            "pentagon": { type: "i", value: 0 },

            "shaderFocus":  { type: "i", value: 1 },
            "focusCoords":  { type: "v2", value: new THREE.Vector2()},


        },

        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),

        fragmentShader: [

            "varying vec2 vUv;",

            "uniform sampler2D tColor;",
            "uniform sampler2D tDepth;",
            "uniform float textureWidth;",
            "uniform float textureHeight;",

            "const float PI = 3.14159265;",

            "float width = textureWidth; //texture width",
            "float height = textureHeight; //texture height",

            "vec2 texel = vec2(1.0/width,1.0/height);",

            "uniform float focalDepth;  //focal distance value in meters, but you may use autofocus option below",
            "uniform float focalLength; //focal length in mm",
            "uniform float fstop; //f-stop value",
            "uniform bool showFocus; //show debug focus point and focal range (red = focal point, green = focal range)",

            "/*",
            "make sure that these two values are the same for your camera, otherwise distances will be wrong.",
            "*/",

            "uniform float znear; // camera clipping start",
            "uniform float zfar; // camera clipping end",

            "//------------------------------------------",
            "//user variables",

            "const int samples = SAMPLES; //samples on the first ring",
            "const int rings = RINGS; //ring count",

            "const int maxringsamples = rings * samples;",

            "uniform bool manualdof; // manual dof calculation",
            "float ndofstart = 1.0; // near dof blur start",
            "float ndofdist = 2.0; // near dof blur falloff distance",
            "float fdofstart = 1.0; // far dof blur start",
            "float fdofdist = 3.0; // far dof blur falloff distance",

            "float CoC = 0.03; //circle of confusion size in mm (35mm film = 0.03mm)",

            "uniform bool vignetting; // use optical lens vignetting",

            "float vignout = 1.3; // vignetting outer border",
            "float vignin = 0.0; // vignetting inner border",
            "float vignfade = 22.0; // f-stops till vignete fades",

            "uniform bool shaderFocus;",

            "bool autofocus = shaderFocus;",
            "//use autofocus in shader - use with focusCoords",
            "// disable if you use external focalDepth value",

            "uniform vec2 focusCoords;",
            "// autofocus point on screen (0.0,0.0 - left lower corner, 1.0,1.0 - upper right)",
            "// if center of screen use vec2(0.5, 0.5);",

            "uniform float maxblur;",
            "//clamp value of max blur (0.0 = no blur, 1.0 default)",

            "uniform float threshold; // highlight threshold;",
            "uniform float gain; // highlight gain;",

            "uniform float bias; // bokeh edge bias",
            "uniform float fringe; // bokeh chromatic aberration / fringing",

            "uniform bool noise; //use noise instead of pattern for sample dithering",

            "uniform float dithering;",
            "float namount = dithering; //dither amount",

            "uniform bool depthblur; // blur the depth buffer",
            "float dbsize = 1.25; // depth blur size",

            "/*",
            "next part is experimental",
            "not looking good with small sample and ring count",
            "looks okay starting from samples = 4, rings = 4",
            "*/",

            "uniform bool pentagon; //use pentagon as bokeh shape?",
            "float feather = 0.4; //pentagon shape feather",

            "//------------------------------------------",

            "float penta(vec2 coords) {",
            "//pentagonal shape",
            "float scale = float(rings) - 1.3;",
            "vec4  HS0 = vec4( 1.0,         0.0,         0.0,  1.0);",
            "vec4  HS1 = vec4( 0.309016994, 0.951056516, 0.0,  1.0);",
            "vec4  HS2 = vec4(-0.809016994, 0.587785252, 0.0,  1.0);",
            "vec4  HS3 = vec4(-0.809016994,-0.587785252, 0.0,  1.0);",
            "vec4  HS4 = vec4( 0.309016994,-0.951056516, 0.0,  1.0);",
            "vec4  HS5 = vec4( 0.0        ,0.0         , 1.0,  1.0);",

            "vec4  one = vec4( 1.0 );",

            "vec4 P = vec4((coords),vec2(scale, scale));",

            "vec4 dist = vec4(0.0);",
            "float inorout = -4.0;",

            "dist.x = dot( P, HS0 );",
            "dist.y = dot( P, HS1 );",
            "dist.z = dot( P, HS2 );",
            "dist.w = dot( P, HS3 );",

            "dist = smoothstep( -feather, feather, dist );",

            "inorout += dot( dist, one );",

            "dist.x = dot( P, HS4 );",
            "dist.y = HS5.w - abs( P.z );",

            "dist = smoothstep( -feather, feather, dist );",
            "inorout += dist.x;",

            "return clamp( inorout, 0.0, 1.0 );",
            "}",

            "float bdepth(vec2 coords) {",
            "// Depth buffer blur",
            "float d = 0.0;",
            "float kernel[9];",
            "vec2 offset[9];",

            "vec2 wh = vec2(texel.x, texel.y) * dbsize;",

            "offset[0] = vec2(-wh.x,-wh.y);",
            "offset[1] = vec2( 0.0, -wh.y);",
            "offset[2] = vec2( wh.x -wh.y);",

            "offset[3] = vec2(-wh.x,  0.0);",
            "offset[4] = vec2( 0.0,   0.0);",
            "offset[5] = vec2( wh.x,  0.0);",

            "offset[6] = vec2(-wh.x, wh.y);",
            "offset[7] = vec2( 0.0,  wh.y);",
            "offset[8] = vec2( wh.x, wh.y);",

            "kernel[0] = 1.0/16.0;   kernel[1] = 2.0/16.0;   kernel[2] = 1.0/16.0;",
            "kernel[3] = 2.0/16.0;   kernel[4] = 4.0/16.0;   kernel[5] = 2.0/16.0;",
            "kernel[6] = 1.0/16.0;   kernel[7] = 2.0/16.0;   kernel[8] = 1.0/16.0;",


            "for( int i=0; i<9; i++ ) {",
            "float tmp = texture2D(tDepth, coords + offset[i]).r;",
            "d += tmp * kernel[i];",
            "}",

            "return d;",
            "}",


            "vec3 color(vec2 coords,float blur) {",
            "//processing the sample",

            "vec3 col = vec3(0.0);",

            "col.r = texture2D(tColor,coords + vec2(0.0,1.0)*texel*fringe*blur).r;",
            "col.g = texture2D(tColor,coords + vec2(-0.866,-0.5)*texel*fringe*blur).g;",
            "col.b = texture2D(tColor,coords + vec2(0.866,-0.5)*texel*fringe*blur).b;",

            "vec3 lumcoeff = vec3(0.299,0.587,0.114);",
            "float lum = dot(col.rgb, lumcoeff);",
            "float thresh = max((lum-threshold)*gain, 0.0);",
            "return col+mix(vec3(0.0),col,thresh*blur);",
            "}",

            "vec2 rand(vec2 coord) {",
            "// generating noise / pattern texture for dithering",

            "float noiseX = ((fract(1.0-coord.s*(width/2.0))*0.25)+(fract(coord.t*(height/2.0))*0.75))*2.0-1.0;",
            "float noiseY = ((fract(1.0-coord.s*(width/2.0))*0.75)+(fract(coord.t*(height/2.0))*0.25))*2.0-1.0;",

            "if (noise) {",
            "noiseX = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233))) * 43758.5453),0.0,1.0)*2.0-1.0;",
            "noiseY = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233)*2.0)) * 43758.5453),0.0,1.0)*2.0-1.0;",
            "}",

            "return vec2(noiseX,noiseY);",
            "}",

            "vec3 debugFocus(vec3 col, float blur, float depth) {",
            "float edge = 0.002*depth; //distance based edge smoothing",
            "float m = clamp(smoothstep(0.0,edge,blur),0.0,1.0);",
            "float e = clamp(smoothstep(1.0-edge,1.0,blur),0.0,1.0);",

            "col = mix(col,vec3(1.0,0.5,0.0),(1.0-m)*0.6);",
            "col = mix(col,vec3(0.0,0.5,1.0),((1.0-e)-(1.0-m))*0.2);",

            "return col;",
            "}",

            "float linearize(float depth) {",
            "return -zfar * znear / (depth * (zfar - znear) - zfar);",
            "}",


            "float vignette() {",
            "float dist = distance(vUv.xy, vec2(0.5,0.5));",
            "dist = smoothstep(vignout+(fstop/vignfade), vignin+(fstop/vignfade), dist);",
            "return clamp(dist,0.0,1.0);",
            "}",

            "float gather(float i, float j, int ringsamples, inout vec3 col, float w, float h, float blur) {",
            "float rings2 = float(rings);",
            "float step = PI*2.0 / float(ringsamples);",
            "float pw = cos(j*step)*i;",
            "float ph = sin(j*step)*i;",
            "float p = 1.0;",
            "if (pentagon) {",
            "p = penta(vec2(pw,ph));",
            "}",
            "col += color(vUv.xy + vec2(pw*w,ph*h), blur) * mix(1.0, i/rings2, bias) * p;",
            "return 1.0 * mix(1.0, i /rings2, bias) * p;",
            "}",

            "void main() {",
            "//scene depth calculation",

            "float depth = linearize(texture2D(tDepth,vUv.xy).x);",

            "// Blur depth?",
            "if (depthblur) {",
            "depth = linearize(bdepth(vUv.xy));",
            "}",

            "//focal plane calculation",

            "float fDepth = focalDepth;",

            "if (autofocus) {",

            "fDepth = linearize(texture2D(tDepth,focusCoords).x);",

            "}",

            "// dof blur factor calculation",

            "float blur = 0.0;",

            "if (manualdof) {",
            "float a = depth-fDepth; // Focal plane",
            "float b = (a-fdofstart)/fdofdist; // Far DoF",
            "float c = (-a-ndofstart)/ndofdist; // Near Dof",
            "blur = (a>0.0) ? b : c;",
            "} else {",
            "float f = focalLength; // focal length in mm",
            "float d = fDepth*1000.0; // focal plane in mm",
            "float o = depth*1000.0; // depth in mm",

            "float a = (o*f)/(o-f);",
            "float b = (d*f)/(d-f);",
            "float c = (d-f)/(d*fstop*CoC);",

            "blur = abs(a-b)*c;",
            "}",

            "blur = clamp(blur,0.0,1.0);",

            "// calculation of pattern for dithering",

            "vec2 noise = rand(vUv.xy)*namount*blur;",

            "// getting blur x and y step factor",

            "float w = (1.0/width)*blur*maxblur+noise.x;",
            "float h = (1.0/height)*blur*maxblur+noise.y;",

            "// calculation of final color",

            "vec3 col = vec3(0.0);",

            "if(blur < 0.05) {",
            "//some optimization thingy",
            "col = texture2D(tColor, vUv.xy).rgb;",
            "} else {",
            "col = texture2D(tColor, vUv.xy).rgb;",
            "float s = 1.0;",
            "int ringsamples;",

            "for (int i = 1; i <= rings; i++) {",
            "/*unboxstart*/",
            "ringsamples = i * samples;",

            "for (int j = 0 ; j < maxringsamples ; j++) {",
            "if (j >= ringsamples) break;",
            "s += gather(float(i), float(j), ringsamples, col, w, h, blur);",
            "}",
            "/*unboxend*/",
            "}",

            "col /= s; //divide by sample count",
            "}",

            "if (showFocus) {",
            "col = debugFocus(col, blur, depth);",
            "}",

            "if (vignetting) {",
            "col *= vignette();",
            "}",

            "gl_FragColor.rgb = col;",
            "gl_FragColor.a = 1.0;",
            "} "

        ].join("\n")

    };

    init();
    animate();

};

lostIntro();