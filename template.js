import * as THREE from 'three';

const newTing = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer;

    init();
    animate();

    function init() {

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 50);

        // const gridHelper = new THREE.GridHelper(10, 10);
        // scene.add( gridHelper );

        camera.position.set(0, 0, 5);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(renderWidth, renderHeight);

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

    function animate() {

        requestAnimationFrame(animate);

        render();
    }

    function render() {

        renderer.render(scene, camera);

    }

};

newTing();