import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';

let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
    scene, camera, renderer, controls, outerDome, innerDome,
    light1, light2,
    mouseX = 0, mouseY = 0,
    windowHalfX = renderWidth / 2,
    windowHalfY = renderHeight / 2,
    clock = new THREE.Clock(),
    time, elapsedTime;

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x666666, 0);

    camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 2000);
// const cameraHelper = new THREE.CameraHelper( camera );
// scene.add( cameraHelper );

    controls = new OrbitControls(camera);

    //scene.add(new THREE.HemisphereLight(0x050505, 0xCCCCCC));

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
	let light,
        sphere = new THREE.SphereGeometry( 0.025, 16, 8 );

    light1 = new THREE.PointLight(0x139AFF, 5, 100, 1);
    //light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xfb3550 } ) ) );
    light1.position.set(1.5, 0, 0);
    scene.add(light1);

    light2 = new THREE.PointLight(0xFF7D33, 5, 100, 1);
    //light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x002288 } ) ) );
    light2.position.set(-1.5, 0, 0);
    scene.add(light2);

    light = new THREE.AmbientLight(0x7c6e87, 0.8);
    scene.add(light);



    let innerDomeGeometry = new THREE.SphereGeometry(1, 100, 100);
    let innerDomeMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 0
        //shading: THREE.FlatShading,
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

    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    //document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    //document.addEventListener( 'touchmove', onDocumentTouchMove, false );

}

//function onDocumentMouseMove( event ) {
//    mouseX = event.clientX - windowHalfX;
//    mouseY = event.clientY - windowHalfY;
//}
//
//function onDocumentTouchStart( event ) {
//    if ( event.touches.length > 1 ) {
//        event.preventDefault();
//        mouseX = event.touches[ 0 ].pageX - windowHalfX;
//        mouseY = event.touches[ 0 ].pageY - windowHalfY;
//    }
//}
//function onDocumentTouchMove( event ) {
//    if ( event.touches.length == 1 ) {
//        event.preventDefault();
//        mouseX = event.touches[ 0 ].pageX - windowHalfX;
//        mouseY = event.touches[ 0 ].pageY - windowHalfY;
//    }
//}

function animate() {

	requestAnimationFrame( animate );

	render();
}

function render() {

    time = Date.now() * 0.0005;
    elapsedTime = clock.getElapsedTime() * 5;

    light1.position.x = -1.5 * Math.cos(-elapsedTime);
    light1.position.y = -1.5 * Math.sin(-elapsedTime);

    light2.position.x = 1.5 * Math.cos(-elapsedTime);
    light2.position.y = 1.5 * Math.sin(-elapsedTime);

    //innerDome.rotation.x += 0.01;
    //innerDome.rotation.y += 0.01;

    controls.update();

    //camera.position.x += ( mouseX - camera.position.x ) * .1;
    //camera.position.y += ( - mouseY - camera.position.y ) * .1;
    //
    //camera.lookAt( scene.position );

    renderer.render(scene, camera);

}
