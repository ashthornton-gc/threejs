import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';
import OrbitControls from 'three-orbitcontrols';

let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
let renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

const renderer = new THREE.WebGLRenderer( {  } );
renderer.setSize( renderWidth, renderHeight );
renderer.shadowMap.enabled = true;

document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

// scene.background = new THREE.Color( 0xFFFFFF );

const camera = new THREE.PerspectiveCamera( 45, renderWidth / renderHeight, 1, 500 );
// const cameraHelper = new THREE.CameraHelper( camera );
// scene.add( cameraHelper );

// const controls = new TrackballControls( camera );
// controls.rotateSpeed = 1.0;
// controls.zoomSpeed = 1.2;
// controls.panSpeed = 0.8;
// controls.noZoom = false;
// controls.noPan = false;
// controls.staticMoving = true;
// controls.dynamicDampingFactor = 0.3;

const controls = new OrbitControls( camera );

scene.add( new THREE.HemisphereLight( 0x050505, 0xCCCCCC ) );

const gridHelper = new THREE.GridHelper( 10, 10 );
// scene.add( gridHelper );

const light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 1, 0 );
light.position.multiplyScalar( 10 );
scene.add( light );

light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;

const lightHelper = new THREE.DirectionalLightHelper( light );
// scene.add( lightHelper );

const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
const cubeMaterial = new THREE.MeshPhongMaterial( { color: 0x1cff94 } );

const cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
cube.position.x = 0;
cube.position.y = 1;
cube.position.z = 0;
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

let groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
let groundMat = new THREE.MeshPhongMaterial( { color: 0xCCCCCC } );
let ground = new THREE.Mesh( groundGeo, groundMat );
ground.rotation.x = -Math.PI/2;
ground.position.y = 0;
scene.add( ground );
ground.receiveShadow = true;

camera.position.z = 5;

const animate = function () {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	controls.update();

	renderer.render(scene, camera);
};

animate();
