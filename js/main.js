import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';

let renderWidth, renderHeight, scene, camera, renderer, controls, outerDome, innerDome;

init();
animate();

function init() {

    renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x666666, 0);

    camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 2000);
// const cameraHelper = new THREE.CameraHelper( camera );
// scene.add( cameraHelper );

    controls = new OrbitControls(camera);

    scene.add(new THREE.HemisphereLight(0x050505, 0xCCCCCC));

    // const gridHelper = new THREE.GridHelper(10, 10);
    // scene.add( gridHelper );

    // Dome
    let outerDomeGeometry = new THREE.IcosahedronGeometry(400, 1);
    let outerDomeMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shading: THREE.FlatShading,
        side: THREE.BackSide
    });
    outerDome = new THREE.Mesh(outerDomeGeometry, outerDomeMaterial);
    scene.add(outerDome);

    // lights
	let light, light1, light2,
        sphere = new THREE.SphereGeometry( 0.025, 16, 8 );

    light1 = new THREE.PointLight(0xfb3550, 1, 100, 1);
    // light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xfb3550 } ) ) );
    light1.position.set(1, 1, 1);
    scene.add(light1);

    light2 = new THREE.PointLight(0x002288, 1, 100, 1);
    // light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x002288 } ) ) );
    light2.position.set(-1, -1, -1);
    scene.add(light2);

    light = new THREE.AmbientLight(0x7c6e87, 0.8);
    scene.add(light);



    let innerDomeGeometry = new THREE.IcosahedronGeometry(1, 1);
    let innerDomeMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shading: THREE.FlatShading,
    });
    innerDome = new THREE.Mesh(innerDomeGeometry, innerDomeMaterial);
    scene.add(innerDome);

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(renderWidth, renderHeight);
    // renderer.shadowMap.enabled = true;
    renderer.setClearColor(scene.fog.color);

    document.body.appendChild(renderer.domElement);

}

function animate() {

	requestAnimationFrame( animate );

	innerDome.rotation.x += 0.01;
	// innerDome.rotation.y += 0.01;

	controls.update();

	render();
};

function render() {

    renderer.render(scene, camera);

}
