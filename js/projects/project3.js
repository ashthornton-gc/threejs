import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';

const project3 = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls, plane, planeGeometry, planeMaterial,
        clock = new THREE.Clock(), timeElapsed;

    init();
    animate();

    function init() {

        scene = new THREE.Scene();

        renderer = new THREE.WebGLRenderer({antialias: false});
        renderer.setSize(renderWidth, renderHeight);
        document.body.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 0.1, 1000);
        camera.position.set(1.653261805025858, -40.45462647397489, 38.1858783761609);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        controls = new OrbitControls( camera );

        // const gridHelper = new THREE.GridHelper(100, 100);
        // scene.add( gridHelper );

        planeGeometry = new THREE.PlaneGeometry(100, 100, 500, 500);
        planeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, wireframe: true, transparent: true, opacity: 0.98 });
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.castShadow = true;
        plane.receiveShadow = true;

        // plane.rotation.x = -0.4 * Math.PI;
        plane.position.set(0, 0, 0);

        scene.add( plane );

        // let box = new THREE.Mesh( new THREE.BoxGeometry(10,10,10), new THREE.MeshBasicMaterial({color: 0xFFFFFF}));
        // box.position.set(0, 5, 0);
        // box.castShadow = true;
        // scene.add( box );

        let light = new THREE.PointLight(0x5FD6E3, 1, 75, 0.5);
        light.castShadow = true;
        light.position.set(25, -5, 25); // turq
        scene.add( light );

        // scene.add( new THREE.PointLightHelper( light ) );

        light = new THREE.PointLight(0x7554D9, 1, 75, 0.5);
        light.castShadow = true;
        light.position.set(-40, -46, 20); //pink
        scene.add( light );

        // scene.add( new THREE.PointLightHelper( light ) );

        light = new THREE.PointLight(0xDBB1F0, 1, 75, 0.5);
        light.castShadow = true;
        light.position.set(-20, -10, 25); //purple
        scene.add( light );

        // scene.add( new THREE.PointLightHelper( light ) );

        // light = new THREE.PointLight(0xFFFFFF, 0.7, 60, 0.5);
        // light.castShadow = true;
        // light.position.set(0, -25, 40);
        // scene.add( light );
        //
        // scene.add( new THREE.PointLightHelper( light ) );

        // light = new THREE.DirectionalLight(0xFFFFFF, 1);
        // light.castShadow = true;
        // light.position.set( 75, 0, 25 );
        // scene.add( light );
        //
        // scene.add( new THREE.DirectionalLightHelper(light) );

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

        controls.update();

        timeElapsed = clock.getElapsedTime();

        let center = new THREE.Vector2(25,-15);
        let vLength = plane.geometry.vertices.length;

        for( let i = 0; i < vLength; i++ ) {

            let v = plane.geometry.vertices[i];
            let dist = new THREE.Vector2(v.x, v.y).sub(center);
            let size = 0.5;
            let magnitude = 7.5;
            // console.log(dist.length());
            v.z = Math.sin( dist.length() / -size + (timeElapsed * 2) ) * magnitude;
            // v.y = Math.sin( 80 / -0.5 + timeElapsed ) * 2;

        }

        plane.geometry.verticesNeedUpdate = true;

        renderer.render(scene, camera);

    }

}

export default project3;