import * as THREE from 'three';
import { EffectComposer, RenderPass, FXAAShader} from 'three-addons';
import dat from 'dat.gui';
import OrbitControls from 'three-orbitcontrols';

const depthOfField = function() {

    function d3threeD( exports ) {
        var DEGS_TO_RADS = Math.PI / 180, UNIT_SIZE = 100;
        var DIGIT_0 = 48, DIGIT_9 = 57, COMMA = 44, SPACE = 32, PERIOD = 46, MINUS = 45;
        exports.transformSVGPath = function transformSVGPath( pathStr ) {
            var path = new THREE.ShapePath();
            var idx = 1, len = pathStr.length, activeCmd,
                x = 0, y = 0, nx = 0, ny = 0, firstX = null, firstY = null,
                x1 = 0, x2 = 0, y1 = 0, y2 = 0,
                rx = 0, ry = 0, xar = 0, laf = 0, sf = 0, cx, cy;
            function eatNum() {
                var sidx, c, isFloat = false, s;
                // eat delims
                while ( idx < len ) {
                    c = pathStr.charCodeAt( idx );
                    if ( c !== COMMA && c !== SPACE ) break;
                    idx ++;
                }
                if ( c === MINUS ) {
                    sidx = idx ++;
                } else {
                    sidx = idx;
                }
                // eat number
                while ( idx < len ) {
                    c = pathStr.charCodeAt( idx );
                    if ( DIGIT_0 <= c && c <= DIGIT_9 ) {
                        idx ++;
                        continue;
                    } else if ( c === PERIOD ) {
                        idx ++;
                        isFloat = true;
                        continue;
                    }
                    s = pathStr.substring( sidx, idx );
                    return isFloat ? parseFloat( s ) : parseInt( s );
                }
                s = pathStr.substring( sidx );
                return isFloat ? parseFloat( s ) : parseInt( s );
            }
            function nextIsNum() {
                var c;
                // do permanently eat any delims...
                while ( idx < len ) {
                    c = pathStr.charCodeAt( idx );
                    if ( c !== COMMA && c !== SPACE ) break;
                    idx ++;
                }
                c = pathStr.charCodeAt( idx );
                return ( c === MINUS || ( DIGIT_0 <= c && c <= DIGIT_9 ) );
            }
            var canRepeat;
            activeCmd = pathStr[ 0 ];
            while ( idx <= len ) {
                canRepeat = true;
                switch ( activeCmd ) {
                    // moveto commands, become lineto's if repeated
                    case 'M':
                        x = eatNum();
                        y = eatNum();
                        path.moveTo( x, y );
                        activeCmd = 'L';
                        firstX = x;
                        firstY = y;
                        break;
                    case 'm':
                        x += eatNum();
                        y += eatNum();
                        path.moveTo( x, y );
                        activeCmd = 'l';
                        firstX = x;
                        firstY = y;
                        break;
                    case 'Z':
                    case 'z':
                        canRepeat = false;
                        if ( x !== firstX || y !== firstY ) path.lineTo( firstX, firstY );
                        break;
                    // - lines!
                    case 'L':
                    case 'H':
                    case 'V':
                        nx = ( activeCmd === 'V' ) ? x : eatNum();
                        ny = ( activeCmd === 'H' ) ? y : eatNum();
                        path.lineTo( nx, ny );
                        x = nx;
                        y = ny;
                        break;
                    case 'l':
                    case 'h':
                    case 'v':
                        nx = ( activeCmd === 'v' ) ? x : ( x + eatNum() );
                        ny = ( activeCmd === 'h' ) ? y : ( y + eatNum() );
                        path.lineTo( nx, ny );
                        x = nx;
                        y = ny;
                        break;
                    // - cubic bezier
                    case 'C':
                        x1 = eatNum(); y1 = eatNum();
                    case 'S':
                        if ( activeCmd === 'S' ) {
                            x1 = 2 * x - x2;
                            y1 = 2 * y - y2;
                        }
                        x2 = eatNum();
                        y2 = eatNum();
                        nx = eatNum();
                        ny = eatNum();
                        path.bezierCurveTo( x1, y1, x2, y2, nx, ny );
                        x = nx; y = ny;
                        break;
                    case 'c':
                        x1 = x + eatNum();
                        y1 = y + eatNum();
                    case 's':
                        if ( activeCmd === 's' ) {
                            x1 = 2 * x - x2;
                            y1 = 2 * y - y2;
                        }
                        x2 = x + eatNum();
                        y2 = y + eatNum();
                        nx = x + eatNum();
                        ny = y + eatNum();
                        path.bezierCurveTo( x1, y1, x2, y2, nx, ny );
                        x = nx; y = ny;
                        break;
                    // - quadratic bezier
                    case 'Q':
                        x1 = eatNum(); y1 = eatNum();
                    case 'T':
                        if ( activeCmd === 'T' ) {
                            x1 = 2 * x - x1;
                            y1 = 2 * y - y1;
                        }
                        nx = eatNum();
                        ny = eatNum();
                        path.quadraticCurveTo( x1, y1, nx, ny );
                        x = nx;
                        y = ny;
                        break;
                    case 'q':
                        x1 = x + eatNum();
                        y1 = y + eatNum();
                    case 't':
                        if ( activeCmd === 't' ) {
                            x1 = 2 * x - x1;
                            y1 = 2 * y - y1;
                        }
                        nx = x + eatNum();
                        ny = y + eatNum();
                        path.quadraticCurveTo( x1, y1, nx, ny );
                        x = nx; y = ny;
                        break;
                    // - elliptical arc
                    case 'A':
                        rx = eatNum();
                        ry = eatNum();
                        xar = eatNum() * DEGS_TO_RADS;
                        laf = eatNum();
                        sf = eatNum();
                        nx = eatNum();
                        ny = eatNum();
                        if ( rx !== ry ) console.warn( 'Forcing elliptical arc to be a circular one:', rx, ry );
                        // SVG implementation notes does all the math for us! woo!
                        // http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
                        // step1, using x1 as x1'
                        x1 = Math.cos( xar ) * ( x - nx ) / 2 + Math.sin( xar ) * ( y - ny ) / 2;
                        y1 = - Math.sin( xar ) * ( x - nx ) / 2 + Math.cos( xar ) * ( y - ny ) / 2;
                        // step 2, using x2 as cx'
                        var norm = Math.sqrt( ( rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1 ) /
                            ( rx * rx * y1 * y1 + ry * ry * x1 * x1 ) );
                        if ( laf === sf ) norm = - norm;
                        x2 = norm * rx * y1 / ry;
                        y2 = norm * -ry * x1 / rx;
                        // step 3
                        cx = Math.cos( xar ) * x2 - Math.sin( xar ) * y2 + ( x + nx ) / 2;
                        cy = Math.sin( xar ) * x2 + Math.cos( xar ) * y2 + ( y + ny ) / 2;
                        var u = new THREE.Vector2( 1, 0 );
                        var v = new THREE.Vector2( ( x1 - x2 ) / rx, ( y1 - y2 ) / ry );
                        var startAng = Math.acos( u.dot( v ) / u.length() / v.length() );
                        if ( ( ( u.x * v.y ) - ( u.y * v.x ) ) < 0 ) startAng = - startAng;
                        // we can reuse 'v' from start angle as our 'u' for delta angle
                        u.x = ( - x1 - x2 ) / rx;
                        u.y = ( - y1 - y2 ) / ry;
                        var deltaAng = Math.acos( v.dot( u ) / v.length() / u.length() );
                        // This normalization ends up making our curves fail to triangulate...
                        if ( ( ( v.x * u.y ) - ( v.y * u.x ) ) < 0 ) deltaAng = - deltaAng;
                        if ( ! sf && deltaAng > 0 ) deltaAng -= Math.PI * 2;
                        if ( sf && deltaAng < 0 ) deltaAng += Math.PI * 2;
                        path.absarc( cx, cy, rx, startAng, startAng + deltaAng, sf );
                        x = nx;
                        y = ny;
                        break;
                    default:
                        throw new Error( 'Wrong path command: ' + activeCmd );
                }
                // just reissue the command
                if ( canRepeat && nextIsNum() ) continue;
                activeCmd = pathStr[ idx ++ ];
            }
            return path;
        }
    }

    var $d3g = {};
    d3threeD( $d3g );

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls, mesh, group,
        postprocessing = {},
        material_depth;

    var shaderSettings = {
        rings: 3,
        samples: 4
    };

    let materials = [], objects = [],
        singleMaterial, zmaterial = [],
        parameters, i, j, k, h, color, x, y, z, s, n, nobjects, cubeMaterial;

    let svgPath = 'M42.1,23.7l12.5-12.5C48.8,4.1,40.1,0,30.9,0C13.8,0,0,13.8,0,30.9c0,17,13.8,30.9,30.9,30.9' +
    'c9.2,0,17.9-4.1,23.8-11.2L35,30.9L30.9,35l15.6,15.6l-0.3,0.3c-4.4,3.4-9.7,5.2-15.2,5.2C17,56,5.8,44.7,5.8,30.9S17,5.8,30.9,5.8' +
    'c5.6,0,10.8,1.8,15.2,5.2l0.3,0.3l-4.2,4.2L42,15.3c-3.3-2.3-7.1-3.5-11.1-3.5c-10.6,0-19.2,8.6-19.2,19.2S20.3,50,30.9,50' +
    'c2.2,0,4.4-0.4,6.4-1.1l-4.8-4.8c-0.5,0.1-1.1,0.1-1.6,0.1c-7.4,0-13.4-6-13.4-13.4s6-13.4,13.4-13.4c2.5,0,4.9,0.7,7.1,2' +
    'C39.6,20.6,41.1,22,42.1,23.7';

    function init() {

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 10000);
        camera.position.z = 100;

        controls = new OrbitControls( camera );

        material_depth = new THREE.MeshDepthMaterial();

         const gridHelper = new THREE.GridHelper(1000, 1000);
         scene.add( gridHelper );

        let path = $d3g.transformSVGPath( svgPath );
        let simpleShape = path.toShapes( true );

        // our shader material
        const material = new THREE.MeshPhongMaterial({
            color: 0x1cff94,
            shininess: 40,
            specular: 0x149856
            //wireframe: true
        });

        let shape3d = new THREE.ExtrudeBufferGeometry( simpleShape, {
            amount: 5,
            steps: 10,
            curveSegments: 100,
            bevelEnabled: false
        } );

        shape3d.center();

        group = new THREE.Group();

        mesh = new THREE.Mesh( shape3d, material );
        // mesh.scale.set(50,50,50);
        // group.add( mesh );
        // group.add(new THREE.BoxHelper( mesh, 0xFFFFFF ));

        var xgrid = 3,
            ygrid = 3,
            zgrid = 3;
        nobjects = xgrid * ygrid * zgrid;
        var s = 0.5;
        var count = 0;
        for ( i = 0; i < xgrid; i ++ )
            for ( j = 0; j < ygrid; j ++ )
                for ( k = 0; k < zgrid; k ++ ) {
                    var mesh;
                        mesh = new THREE.Mesh( shape3d, new THREE.MeshPhongMaterial({
                            color: 0x1cff94,
                            shininess: 30,
                            specular: 0x149856
                            //wireframe: true
                        }) );
                        materials[ count ] = mesh.material;
                    x = 50 * ( i - xgrid/2 );
                    y = 50 * ( j - ygrid/2 );
                    z = 50 * ( k - zgrid/2 );
                    mesh.position.set( x, y, z );
                    mesh.scale.set( s, s, s );
                    mesh.matrixAutoUpdate = false;
                    mesh.updateMatrix();
                    scene.add( mesh );
                    mesh.rotation.x = THREE.Math.degToRad( 180 );
                    objects.push( mesh );
                    count ++;
                }

        // scene.add( group );

        // mesh.position.set(0,0,0);
        // group.rotation.x = THREE.Math.degToRad( 120 );
        // group.rotation.y = THREE.Math.degToRad( 15 );

        // let axesHelper = new THREE.AxesHelper( 10 );
        // scene.add( axesHelper );

        let light = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 0.5);
        scene.add(light);

        let dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        dirLight.position.set(5,2,5);
        scene.add(dirLight);

        // let lightHelper = new THREE.DirectionalLightHelper(dirLight);
        // scene.add(lightHelper);

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize(renderWidth, renderHeight);
        document.body.appendChild(renderer.domElement);

        scene.matrixAutoUpdate = false;
        initPostprocessing();
        renderer.autoClear = false;

        window.addEventListener('resize', onWindowResize, false);

        let effectController  = {
            enabled: true,
            jsDepthCalculation: true,
            shaderFocus: false,
            fstop: 7.176,
            maxblur: 0.65,
            showFocus: false,
            focalDepth: 84.3,
            manualdof: true,
            vignetting: false,
            depthblur: false,
            threshold: 0.529,
            gain: 30.144,
            bias: 0.807,
            fringe: 0.207,
            focalLength: 16,
            noise: true,
            pentagon: false,
            dithering: 0.0001
        };
        var matChanger = function( ) {
            for (var e in effectController) {
                if (e in postprocessing.bokeh_uniforms)
                    postprocessing.bokeh_uniforms[ e ].value = effectController[ e ];
            }
            postprocessing.enabled = effectController.enabled;
            postprocessing.bokeh_uniforms[ 'znear' ].value = camera.near;
            postprocessing.bokeh_uniforms[ 'zfar' ].value = camera.far;
            camera.setFocalLength(effectController.focalLength);
        };
        var gui = new dat.GUI();
        gui.add( effectController, "enabled" ).onChange( matChanger );
        gui.add( effectController, "jsDepthCalculation" ).onChange( matChanger );
        gui.add( effectController, "shaderFocus" ).onChange( matChanger );
        gui.add( effectController, "focalDepth", 0.0, 100.0 ).listen().onChange( matChanger );
        gui.add( effectController, "fstop", 0.1, 22, 0.001 ).onChange( matChanger );
        gui.add( effectController, "maxblur", 0.0, 5.0, 0.025 ).onChange( matChanger );
        gui.add( effectController, "showFocus" ).onChange( matChanger );
        gui.add( effectController, "manualdof" ).onChange( matChanger );
        gui.add( effectController, "vignetting" ).onChange( matChanger );
        gui.add( effectController, "depthblur" ).onChange( matChanger );
        gui.add( effectController, "threshold", 0, 1, 0.001 ).onChange( matChanger );
        gui.add( effectController, "gain", 0, 100, 0.001 ).onChange( matChanger );
        gui.add( effectController, "bias", 0,3, 0.001 ).onChange( matChanger );
        gui.add( effectController, "fringe", 0, 5, 0.001 ).onChange( matChanger );
        gui.add( effectController, "focalLength", 16, 80, 0.001 ).onChange( matChanger );
        gui.add( effectController, "noise" ).onChange( matChanger );
        gui.add( effectController, "dithering", 0, 0.001, 0.0001 ).onChange( matChanger );
        gui.add( effectController, "pentagon" ).onChange( matChanger );
        gui.add( shaderSettings, "rings", 1, 8).step(1).onChange( shaderUpdate );
        gui.add( shaderSettings, "samples", 1, 13).step(1).onChange( shaderUpdate );
        matChanger();

    }

    function onWindowResize() {

        renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(renderWidth, renderHeight);
        postprocessing.composer.setSize( renderWidth, renderHeight );
    }

    function initPostprocessing() {
        postprocessing.scene = new THREE.Scene();
        postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
        postprocessing.camera.position.z = 100;
        postprocessing.scene.add( postprocessing.camera );
        var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
        postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, renderHeight, pars );
        postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, renderHeight, pars );
        var bokeh_shader = THREE.BokehShader;
        postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );
        postprocessing.bokeh_uniforms[ "tColor" ].value = postprocessing.rtTextureColor.texture;
        postprocessing.bokeh_uniforms[ "tDepth" ].value = postprocessing.rtTextureDepth.texture;
        postprocessing.bokeh_uniforms[ "textureWidth" ].value = window.innerWidth;
        postprocessing.bokeh_uniforms[ "textureHeight" ].value = renderHeight;
        postprocessing.materialBokeh = new THREE.ShaderMaterial( {
            uniforms: postprocessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader,
            defines: {
                RINGS: shaderSettings.rings,
                SAMPLES: shaderSettings.samples
            }
        } );
        postprocessing.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
        postprocessing.quad.position.z = - 500;
        postprocessing.scene.add( postprocessing.quad );
    }
    function shaderUpdate() {
        postprocessing.materialBokeh.defines.RINGS = shaderSettings.rings;
        postprocessing.materialBokeh.defines.SAMPLES = shaderSettings.samples;
        postprocessing.materialBokeh.needsUpdate = true;
    }

    function animate() {

        requestAnimationFrame(animate);

        render();
    }

    function render() {

        // group.rotation.y += 0.01;
        controls.update();

        camera.lookAt( scene.position );

        // postprocessing.composer.render( 0.1 );

        // renderer.render( scene, camera );

        renderer.clear();

        // Render scene into texture
        scene.overrideMaterial = null;
        renderer.render( scene, camera, postprocessing.rtTextureColor, true );
        // Render depth into texture
        scene.overrideMaterial = material_depth;
        renderer.render( scene, camera, postprocessing.rtTextureDepth, true );
        // Render bokeh composite
        renderer.render( postprocessing.scene, postprocessing.camera );
    }

    init();
    animate();

};

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

        "textureWidth":  { value: 1.0 },
        "textureHeight":  { value: 1.0 },

        "focalDepth":   { value: 1.0 },
        "focalLength":   { value: 24.0 },
        "fstop": { value: 0.9 },

        "tColor":   { value: null },
        "tDepth":   { value: null },

        "maxblur":  { value: 1.0 },

        "showFocus":   { value: 0 },
        "manualdof":   { value: 0 },
        "vignetting":   { value: 0 },
        "depthblur":   { value: 0 },

        "threshold":  { value: 0.5 },
        "gain":  { value: 2.0 },
        "bias":  { value: 0.5 },
        "fringe":  { value: 0.7 },

        "znear":  { value: 0.1 },
        "zfar":  { value: 100 },

        "noise":  { value: 1 },
        "dithering":  { value: 0.0001 },
        "pentagon": { value: 0 },

        "shaderFocus":  { value: 1 },
        "focusCoords":  { value: new THREE.Vector2() }


    },

    vertexShader: [

        "varying vec2 vUv;",

        "void main() {",

        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join( "\n" ),

    fragmentShader: [

        "#include <common>",

        "varying vec2 vUv;",

        "uniform sampler2D tColor;",
        "uniform sampler2D tDepth;",
        "uniform float textureWidth;",
        "uniform float textureHeight;",

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

        "vec2 wh = vec2(1.0/textureWidth,1.0/textureHeight) * dbsize;",

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
        "vec2 texel = vec2(1.0/textureWidth,1.0/textureHeight);",

        "col.r = texture2D(tColor,coords + vec2(0.0,1.0)*texel*fringe*blur).r;",
        "col.g = texture2D(tColor,coords + vec2(-0.866,-0.5)*texel*fringe*blur).g;",
        "col.b = texture2D(tColor,coords + vec2(0.866,-0.5)*texel*fringe*blur).b;",

        "vec3 lumcoeff = vec3(0.299,0.587,0.114);",
        "float lum = dot(col.rgb, lumcoeff);",
        "float thresh = max((lum-threshold)*gain, 0.0);",
        "return col+mix(vec3(0.0),col,thresh*blur);",
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

        "if (shaderFocus) {",

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

        "vec2 noise = vec2(rand(vUv.xy), rand( vUv.xy + vec2( 0.4, 0.6 ) ) )*dithering*blur;",

        "// getting blur x and y step factor",

        "float w = (1.0/textureWidth)*blur*maxblur+noise.x;",
        "float h = (1.0/textureHeight)*blur*maxblur+noise.y;",

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

    ].join( "\n" )

};

/**
 * Depth-of-field post-process with bokeh shader
 */


THREE.BokehPass = function ( scene, camera, params ) {

    this.scene = scene;
    this.camera = camera;

    var focus = ( params.focus !== undefined ) ? params.focus : 1.0;
    var aspect = ( params.aspect !== undefined ) ? params.aspect : camera.aspect;
    var aperture = ( params.aperture !== undefined ) ? params.aperture : 0.025;
    var maxblur = ( params.maxblur !== undefined ) ? params.maxblur : 1.0;
    var shape = ( params.shape !== undefined ) ? params.shape : 0;

    // render targets

    var width = params.width || window.innerWidth || 1;
    var height = params.height || window.innerHeight || 1;

    this.renderTargetColor = new THREE.WebGLRenderTarget( width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
    } );

    this.renderTargetDepth = this.renderTargetColor.clone();

    // depth material

    this.materialDepth = new THREE.MeshDepthMaterial();

    // bokeh material

    if ( THREE.BokehShader === undefined ) {
        console.error( "THREE.BokehPass relies on THREE.BokehShader" );
    }

    var bokehShader = THREE.BokehShader;
    var bokehUniforms = THREE.UniformsUtils.clone( bokehShader.uniforms );

    bokehUniforms[ "tDepth" ].value = this.renderTargetDepth;

    bokehUniforms[ "focus" ].value = focus;
    bokehUniforms[ "aspect" ].value = aspect;
    bokehUniforms[ "aperture" ].value = aperture;
    bokehUniforms[ "maxblur" ].value = maxblur;
    bokehUniforms[ "shape" ].value = shape;

    this.materialBokeh = new THREE.ShaderMaterial({
        uniforms: bokehUniforms,
        vertexShader: bokehShader.vertexShader,
        fragmentShader: bokehShader.fragmentShader
    });

    this.uniforms = bokehUniforms;
    this.enabled = true;
    this.needsSwap = false;
    this.renderToScreen = false;
    this.clear = false;

    this.camera2 = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    this.scene2  = new THREE.Scene();

    this.quad2 = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
    this.scene2.add( this.quad2 );

};

THREE.BokehPass.prototype = {

    render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

        this.quad2.material = this.materialBokeh;

        // Render depth into texture

        this.scene.overrideMaterial = this.materialDepth;

        renderer.render( this.scene, this.camera, this.renderTargetDepth, true );

        // Render bokeh composite

        this.uniforms[ "tColor" ].value = readBuffer;

        if ( this.renderToScreen ) {

            renderer.render( this.scene2, this.camera2 );

        } else {

            renderer.render( this.scene2, this.camera2, writeBuffer, this.clear );

        }

        this.scene.overrideMaterial = null;

    }

};



export default depthOfField;