import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';

const lostIntro = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls,
        textGeom, textMat, text,
        light;

    init();
    animate();

    function init() {

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x000000 );
        scene.fog = new THREE.Fog({ color: 0x000000, near: 1, far: 2 });

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 50);
        // camera.position.set(0, -5, 20);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // controls = new OrbitControls( camera );

        const gridHelper = new THREE.GridHelper(50, 50);
        // scene.add( gridHelper );

        let loader = new THREE.FontLoader();

        loader.load( 'font/futura.json', function ( font ) {

            textGeom = new THREE.TextGeometry( 'L O S T', {
                font: font,
                size: 5,
                height: 0.5,
                curveSegments: 40,
            } );

            textGeom.center();

            textMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, fog: true });
            text = new THREE.Mesh( textGeom, textMat );
            text.receiveShadow = true;
            scene.add( text );

        } );

        scene.add( new THREE.Mesh( new THREE.BoxGeometry(10, 10, 10), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }) ) );

        // scene.add( new THREE.HemisphereLight( 0xFFFFFF, 0x000000, 0.8) );
        light = new THREE.DirectionalLight( 0xFFFFFF, 0.8 );
        light.castShadow = true;
        light.position.set( -2, -5, 20);
        scene.add( light );

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(renderWidth, renderHeight);
        renderer.setPixelRatio( window.devicePixelRatio );

        document.body.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);

    }

    function onWindowResize() {

        renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(renderWidth, renderHeight);
    }

    var frame = 0,
        maxFrame = 500;

    function render() {

        var per = frame / maxFrame,
            bias = Math.abs(.5 - per) / .5;

        camera.position.z = 100 * bias;
        camera.lookAt(0, 0, 0);

        // controls.update();
        renderer.render(scene, camera);

        frame += 1;
        frame = frame % maxFrame;

    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

};

lostIntro();