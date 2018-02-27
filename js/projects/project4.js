import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';

const project4 = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls, planes = [], planeGeometry, planeMaterial,
        clock = new THREE.Clock(), timeElapsed;

    init();
    animate();

    function init() {

        renderer = new THREE.WebGLRenderer({antialias: false});
        renderer.setSize(renderWidth, renderHeight);
        document.body.appendChild(renderer.domElement);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 1, 500);

        controls = new OrbitControls( camera );

        const gridHelper = new THREE.GridHelper(20, 20);
        gridHelper.position.set(0,0,10);
        scene.add( gridHelper );

        camera.position.set(25, 15, 35);
        camera.lookAt(new THREE.Vector3(0, 0, 20));

        let light = new THREE.PointLight(0x5FD6E3, 0.8, 150, 0.5);
        light.castShadow = true;
        light.position.set(4, 20, 23); // turq
        scene.add( light );

        scene.add( new THREE.PointLightHelper( light ) );

        light = new THREE.PointLight(0xDBB1F0, 0.8, 150, 0.5);
        light.castShadow = true;
        light.position.set(8, 20, 20); //pink
        scene.add( light );

        scene.add( new THREE.PointLightHelper( light ) );

        light = new THREE.PointLight(0x7554D9, 0.8, 150, 0.5);
        light.castShadow = true;
        light.position.set(13, 20, 20); //purple
        scene.add( light );

        scene.add( new THREE.PointLightHelper( light ) );

        scene.add( new THREE.HemisphereLight(0xFFFFFF, 0x000000, 0.5));

        planeGeometry = new THREE.PlaneGeometry(20, 10, 20);
        planeMaterial = new THREE.MeshLambertMaterial( { color: 0xCCCCCC, side: THREE.DoubleSide } );

        for( let i = 0; i < 20; i++ ) {

            planes[i] = new THREE.Mesh( planeGeometry, planeMaterial );
            planes[i].castShadow = true;
            planes[i].position.set( 0, 0, i + 1 );
            scene.add( planes[i] );

        }

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

        let center = new THREE.Vector2(20, 0);

        for ( let x = 0; x < planes.length; x++ ) {

            let vLength = planes[x].geometry.vertices.length;

            for (let i = 0; i < vLength; i++) {
                let v = planes[x].geometry.vertices[i];
                let dist = new THREE.Vector2(v.x, v.y).sub(center);
                let size = 5.0;
                let magnitude = 4;
                v.z = Math.sin(dist.length()/-size + (timeElapsed * 0.5)) * magnitude;
            }
            planes[x].geometry.verticesNeedUpdate = true;

        }

        renderer.render(scene, camera);

    }

}

export default project4;