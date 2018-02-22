import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';
import OrbitControls from 'three-orbitcontrols';

const scene = new THREE.Scene();

// scene.background = new THREE.Color( 0xFFFFFF );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 500 );

const controls = new TrackballControls( camera );
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = false;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

// const controls = new OrbitControls( camera );

const renderer = new THREE.WebGLRenderer( {antialias: true} );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// scene.add( new THREE.AmbientLight( 0xFFFFFF ) );
scene.add( new THREE.HemisphereLight( 0xFFFFF0, 0x999999 ) );

// var light = new THREE.DirectionalLight( 0xffffff );
// light.position.set( 1, 1, 1 ).normalize();
// scene.add( light );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x1cff94 } );
const material = new THREE.MeshPhongMaterial( { color: 0x1cff94 } );

const cube = new THREE.Mesh( geometry, material );
scene.add(cube);

camera.position.z = 5;

const animate = function () {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	controls.update();

	renderer.render(scene, camera);
};

animate();
