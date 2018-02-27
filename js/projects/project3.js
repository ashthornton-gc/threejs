import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import SimplexNoise from 'simplex-noise';
import {GPUComputationRenderer} from 'gpucomputationrender-threejs';

const project3 = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls, plane, planeGeometry, planeMaterial,
        clock = new THREE.Clock(), timeElapsed;

    // Texture width for simulation
    var WIDTH = 64;
    var NUM_TEXELS = WIDTH * WIDTH;
    // Water size in system units
    var BOUNDS = 512;
    var BOUNDS_HALF = BOUNDS * 0.5;
    var mouseMoved = false;
    var mouseCoords = new THREE.Vector2();
    var raycaster = new THREE.Raycaster();
    var waterMesh;
    var meshRay;
    var gpuCompute;
    var heightmapVariable;
    var waterUniforms;
    var smoothShader;
    var simplex = new SimplexNoise();
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    init();
    animate();

    function init() {

        scene = new THREE.Scene();

        renderer = new THREE.WebGLRenderer({antialias: false});
        renderer.setSize(renderWidth, renderHeight);
        document.body.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 0.1, 1000);
        camera.position.set(0,200,300);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        scene.add( new THREE.AxesHelper(250) );

        controls = new OrbitControls( camera );

        initWater();

        let light = new THREE.PointLight(0x5FD6E3, 0.8, 150, 0.5);
        light.castShadow = true;
        light.position.set(-12, 100, 23); // turq
        scene.add( light );

        scene.add( new THREE.PointLightHelper( light ) );

        light = new THREE.PointLight(0xDBB1F0, 0.8, 150, 0.5);
        light.castShadow = true;
        light.position.set(75, 100, 50); //pink
        scene.add( light );

        scene.add( new THREE.PointLightHelper( light ) );

        light = new THREE.PointLight(0x7554D9, 0.8, 150, 0.5);
        light.castShadow = true;
        light.position.set(120, 100, 20); //purple
        scene.add( light );

        scene.add( new THREE.PointLightHelper( light ) );

        scene.add( new THREE.HemisphereLight(0xFFFFFF, 0x000000, 0.5));

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    }

    function initWater() {
        var materialColor = 0xFFFFFF;
        var geometry = new THREE.PlaneBufferGeometry( BOUNDS, BOUNDS, WIDTH - 1, WIDTH -1 );
        // material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
        var material = new THREE.ShaderMaterial( {
            uniforms: THREE.UniformsUtils.merge( [
                THREE.ShaderLib[ 'phong' ].uniforms,
                {
                    heightmap: { value: null }
                }
            ] ),
            vertexShader: document.getElementById( 'waterVertexShader' ).textContent,
            fragmentShader: THREE.ShaderChunk[ 'meshphong_frag' ]
        } );
        material.lights = true;
        // Material attributes from MeshPhongMaterial
        material.color = new THREE.Color( materialColor );
        material.specular = new THREE.Color( 0x111111 );
        material.shininess = 20;
        // Sets the uniforms with the material values
        material.uniforms.diffuse.value = material.color;
        material.uniforms.specular.value = material.specular;
        material.uniforms.shininess.value = Math.max( material.shininess, 1e-4 );
        material.uniforms.opacity.value = material.opacity;
        // Defines
        material.defines.WIDTH = WIDTH.toFixed( 1 );
        material.defines.BOUNDS = BOUNDS.toFixed( 1 );
        waterUniforms = material.uniforms;
        waterMesh = new THREE.Mesh( geometry, material );
        // waterMesh.material.wireframe = true;
        waterMesh.rotation.x = - Math.PI / 2;
        waterMesh.matrixAutoUpdate = false;
        waterMesh.updateMatrix();
        scene.add( waterMesh );
        // Mesh just for mouse raycasting
        var geometryRay = new THREE.PlaneBufferGeometry( BOUNDS, BOUNDS, 1, 1 );
        meshRay = new THREE.Mesh( geometryRay, new THREE.MeshBasicMaterial( { color: 0xFFFFFF, visible: false } ) );
        meshRay.rotation.x = - Math.PI / 2;
        meshRay.matrixAutoUpdate = false;
        meshRay.updateMatrix();
        scene.add( meshRay );
        // Creates the gpu computation class and sets it up
        gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );
        var heightmap0 = gpuCompute.createTexture();
        fillTexture( heightmap0 );
        heightmapVariable = gpuCompute.addVariable( "heightmap", document.getElementById( 'heightmapFragmentShader' ).textContent, heightmap0 );
        gpuCompute.setVariableDependencies( heightmapVariable, [ heightmapVariable ] );
        heightmapVariable.material.uniforms.mousePos = { value: new THREE.Vector2( 10000, 10000 ) };
        heightmapVariable.material.uniforms.mouseSize = { value: 25.0 };
        heightmapVariable.material.uniforms.viscosityConstant = { value: 0.03 };
        heightmapVariable.material.defines.BOUNDS = BOUNDS.toFixed( 1 );
        var error = gpuCompute.init();
        if ( error !== null ) {
            console.error( error );
        }
        // Create compute shader to smooth the water surface and velocity
        //smoothShader = gpuCompute.createShaderMaterial( document.getElementById( 'smoothFragmentShader' ).textContent, { texture: { value: null } } );
    }
    function fillTexture( texture ) {
        var waterMaxHeight = 10;
        function noise( x, y, z ) {
            var multR = waterMaxHeight;
            var mult = 0.025;
            var r = 0;
            for ( var i = 0; i < 15; i++ ) {
                r += multR * simplex.noise2D( x * mult, y * mult );
                multR *= 0.53 + 0.025 * i;
                mult *= 1.25;
            }
            return r;
        }
        var pixels = texture.image.data;
        var p = 0;
        for ( var j = 0; j < WIDTH; j++ ) {
            for ( var i = 0; i < WIDTH; i++ ) {
                var x = i * 128 / WIDTH;
                var y = j * 128 / WIDTH;
                pixels[ p + 0 ] = noise( x, y, 123.4 );
                pixels[ p + 1 ] = 0;
                pixels[ p + 2 ] = 0;
                pixels[ p + 3 ] = 1;
                p += 4;
            }
        }
    }

    function setMouseCoords( x, y ) {
        mouseCoords.set( ( x / renderer.domElement.clientWidth ) * 2 - 1, - ( y / renderer.domElement.clientHeight ) * 2 + 1 );
        mouseMoved = true;
    }

    function onDocumentMouseMove( event ) {
        setMouseCoords( event.clientX, event.clientY );
    }

    function onWindowResize() {

        renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(renderWidth, renderHeight);
    }

    function animate() {

        requestAnimationFrame(animate);

        render();
    }

    function render() {

        controls.update();

        // Set uniforms: mouse interaction
        var uniforms = heightmapVariable.material.uniforms;
        if ( mouseMoved ) {
            raycaster.setFromCamera( mouseCoords, camera );
            var intersects = raycaster.intersectObject( meshRay );
            if ( intersects.length > 0 ) {
                var point = intersects[ 0 ].point;
                uniforms.mousePos.value.set( point.x, point.z );
            }
            else {
                uniforms.mousePos.value.set( 10000, 10000 );
            }
            mouseMoved = false;
        }
        else {
            uniforms.mousePos.value.set( 10000, 10000 );
        }
        // Do the gpu computation
        gpuCompute.compute();
        // Get compute output in custom uniform
        waterUniforms.heightmap.value = gpuCompute.getCurrentRenderTarget( heightmapVariable ).texture;

        renderer.render(scene, camera);

    }

}

export default project3;