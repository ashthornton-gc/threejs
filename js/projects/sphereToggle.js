import * as THREE from 'three';
import { EffectComposer, RenderPass, ShaderPass, MaskPass, SSAOShader, CopyShader } from 'three-addons';
import OrbitControls from 'three-orbitcontrols';
//import ShaderPass from './ShaderPass';
import SSAOPass from './SSAOPass';
import dat from 'dat.gui';

const sphereToggle = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls,
        plane, planeGeom, planeMat,
        sphere, sphereGeom, sphereMat,
        track, trackShape, trackGeom, trackMat,
        light1;

    var effectComposer;
    var ssaoPass;

    var postprocessing = { enabled: false, onlyAO: false, tDiffuse: 32, aoClamp: 0.25, lumInfluence: 0.7 };

    init();
    animate();

    function init() {

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(renderWidth, renderHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(renderer.domElement);

        scene = new THREE.Scene();

        // camera
        camera = new THREE.PerspectiveCamera( 50, renderWidth / renderHeight, 1, 100 );
        camera.position.set(0, 20, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        controls = new OrbitControls( camera );

        //scene.add( new THREE.GridHelper( 50, 50 ) );

        //scene.add( new THREE.AxesHelper( 10 ) );

        // floor
        planeGeom = new THREE.PlaneGeometry( 100, 100, 1 );
        planeMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        plane = new THREE.Mesh( planeGeom, planeMat );
        plane.receiveShadow = true;
        plane.rotation.x = THREE.Math.degToRad(270);
        plane.position.set( 0, -1, 0 );
        scene.add( plane );

        // track

        trackShape = new THREE.Shape();
        ( function roundedRect( ctx, x, y, width, height, radius ) {
            ctx.moveTo( x, y + radius );
            ctx.lineTo( x, y + height - radius );
            ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
            ctx.lineTo( x + width - radius, y + height );
            ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
            ctx.lineTo( x + width, y + radius );
            ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
            ctx.lineTo( x + radius, y );
            ctx.quadraticCurveTo( x, y, x, y + radius );
        } )( trackShape, 0, 0, 4, 2, 1 );
        trackGeom = new THREE.ExtrudeGeometry( trackShape, { amount: 0.2, bevelEnabled: false, bevelSegments: 1, steps: 1, bevelSize: 0, bevelThickness: 0 } );
        trackMat = new THREE.MeshPhongMaterial( { color: 0x808087, emissive: 0x808087, specular: 0x808087, shininess: 10 } );
        track = new THREE.Mesh( trackGeom, trackMat );
        track.receiveShadow = true;
        track.castShadow = true;
        track.rotation.x = THREE.Math.degToRad(270);
        track.position.set( 0, -1, 0 );
        scene.add( track );

        // sphere
        sphereGeom = new THREE.SphereGeometry( 1, 32, 32 );
        sphereMat = new THREE.MeshPhongMaterial({ color: 0x808087, emissive: 0x808087, specular: 0x808087, shininess: 10 });
        sphere = new THREE.Mesh( sphereGeom, sphereMat );
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.position.set( 0, 0, 0 );
        scene.add( sphere );

        // lights

        const hemiLight = new THREE.HemisphereLight( 0xD6D6DF, 0xDDDDDD, 1 );
        //hemiLight.color.setHSL( 240, 0.15, 0.88 );
        //hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        const pointLight = new THREE.DirectionalLight( 0xFFFFFF, 0.05 );
        pointLight.position.set( 15, 20, -20);
        pointLight.castShadow = true;
        //pointLight.shadow.mapSize.width = 64;
        //pointLight.shadow.mapSize.height = 64;
        scene.add( pointLight );
        //scene.add( new THREE.DirectionalLightHelper( pointLight ) );

        initPostprocessing();

        //var gui = new dat.GUI();
        //gui.add( postprocessing, 'enabled' );
        //gui.add( postprocessing, 'onlyAO', false ).onChange( function( value ) { ssaoPass.onlyAO = value; } );
        //gui.add( postprocessing, 'tDiffuse' ).min( 0 ).max( 64 ).onChange( function( value ) { ssaoPass.tDiffuse = value; } );
        //
        //gui.add( postprocessing, 'aoClamp' ).min( 0 ).max( 1 ).onChange( function( value ) { ssaoPass.aoClamp = value; } );
        //
        //gui.add( postprocessing, 'lumInfluence' ).min( 0 ).max( 1 ).onChange( function( value ) { ssaoPass.lumInfluence = value; } );

        window.addEventListener('resize', onWindowResize, false);

    }

    function onWindowResize() {

        renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(renderWidth, renderHeight);
    }

    function initPostprocessing() {
        // Setup render pass
        var renderPass = new RenderPass( scene, camera );
        // Setup SSAO pass
        ssaoPass = new SSAOPass( scene, camera );
        ssaoPass.renderToScreen = true;
        // Add pass to effect composer
        effectComposer = new EffectComposer( renderer );
        effectComposer.addPass( renderPass );
        effectComposer.addPass( ssaoPass );
    }

    function animate() {

        requestAnimationFrame(animate);

        render();
    }

    function render() {

        controls.update();

        if ( postprocessing.enabled ) {
            effectComposer.render();
        } else {
            renderer.render( scene, camera );
        }

    }

};

export default sphereToggle;
