import * as THREE from 'three';
import * as THREE_ADDONS from 'three-addons';
import OrbitControls from 'three-orbitcontrols';
import dat from 'dat.gui';
const TWEEN = require('@tweenjs/tween.js');

const sphereToggle = function() {

    let DIGIT_0 = 48, DIGIT_9 = 57, COMMA = 44, SPACE = 32, PERIOD = 46, MINUS = 45;

    function transformSVGPath( pathStr ) {
        let path = new THREE.ShapePath();
        let idx = 1, len = pathStr.length, activeCmd,
            x = 0, y = 0, nx = 0, ny = 0, firstX = null, firstY = null,
            x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        function eatNum() {
            let sidx, c, isFloat = false, s;
            // eat delims
            while ( idx < len ) {
                c = pathStr.charCodeAt( idx );
                if ( c !== COMMA && c !== SPACE ) break;
                idx ++;
            }
            if ( c === MINUS ) {
                sidx = idx ++;
            } else {
                sidx = idx;
            }
            // eat number
            while ( idx < len ) {
                c = pathStr.charCodeAt( idx );
                if ( DIGIT_0 <= c && c <= DIGIT_9 ) {
                    idx ++;
                    continue;
                } else if ( c === PERIOD ) {
                    idx ++;
                    isFloat = true;
                    continue;
                }
                s = pathStr.substring( sidx, idx );
                return isFloat ? parseFloat( s ) : parseInt( s, 10 );
            }
            s = pathStr.substring( sidx );
            return isFloat ? parseFloat( s ) : parseInt( s, 10 );
        }
        function nextIsNum() {
            let c;
            // do permanently eat any delims...
            while ( idx < len ) {
                c = pathStr.charCodeAt( idx );
                if ( c !== COMMA && c !== SPACE ) break;
                idx ++;
            }
            c = pathStr.charCodeAt( idx );
            return ( c === MINUS || ( DIGIT_0 <= c && c <= DIGIT_9 ) );
        }
        let canRepeat;
        activeCmd = pathStr[ 0 ];
        while ( idx <= len ) {
            canRepeat = true;
            switch ( activeCmd ) {
                // moveto commands, become lineto's if repeated
                case 'M':
                    x = eatNum();
                    y = eatNum();
                    path.moveTo( x, y );
                    activeCmd = 'L';
                    firstX = x;
                    firstY = y;
                    break;
                case 'm':
                    x += eatNum();
                    y += eatNum();
                    path.moveTo( x, y );
                    activeCmd = 'l';
                    firstX = x;
                    firstY = y;
                    break;
                case 'Z':
                case 'z':
                    canRepeat = false;
                    if ( x !== firstX || y !== firstY ) path.lineTo( firstX, firstY );
                    break;
                // - lines!
                case 'L':
                case 'H':
                case 'V':
                    nx = ( activeCmd === 'V' ) ? x : eatNum();
                    ny = ( activeCmd === 'H' ) ? y : eatNum();
                    path.lineTo( nx, ny );
                    x = nx;
                    y = ny;
                    break;
                case 'l':
                case 'h':
                case 'v':
                    nx = ( activeCmd === 'v' ) ? x : ( x + eatNum() );
                    ny = ( activeCmd === 'h' ) ? y : ( y + eatNum() );
                    path.lineTo( nx, ny );
                    x = nx;
                    y = ny;
                    break;
                // - cubic bezier
                case 'C':
                    x1 = eatNum(); y1 = eatNum();
                case 'S':
                    if ( activeCmd === 'S' ) {
                        x1 = 2 * x - x2;
                        y1 = 2 * y - y2;
                    }
                    x2 = eatNum();
                    y2 = eatNum();
                    nx = eatNum();
                    ny = eatNum();
                    path.bezierCurveTo( x1, y1, x2, y2, nx, ny );
                    x = nx; y = ny;
                    break;
                case 'c':
                    x1 = x + eatNum();
                    y1 = y + eatNum();
                case 's':
                    if ( activeCmd === 's' ) {
                        x1 = 2 * x - x2;
                        y1 = 2 * y - y2;
                    }
                    x2 = x + eatNum();
                    y2 = y + eatNum();
                    nx = x + eatNum();
                    ny = y + eatNum();
                    path.bezierCurveTo( x1, y1, x2, y2, nx, ny );
                    x = nx; y = ny;
                    break;

                default:
                    throw new Error( 'Wrong path command: ' + activeCmd );
            }
            // just reissue the command
            if ( canRepeat && nextIsNum() ) continue;
            activeCmd = pathStr[ idx ++ ];
        }
        return path;
    }

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls,
        hemiLight, pointLight,
        plane, planeGeom, planeMat,
        sphere, sphereGeom, sphereMat,
        svgPath,
        track, trackMat, trackPath, trackShape,
        objects = [],
        toggleActive = false,
        mouse = new THREE.Vector2(),
        raycaster = new THREE.Raycaster(),
        gui,
        composer, effectFilm,
        rtParameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat,
            stencilBuffer: true
        },
        delta = 0.001;

    init();
    buildGui();
    animate();

    function init() {

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(renderWidth, renderHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        document.body.appendChild(renderer.domElement);

        scene = new THREE.Scene();

        // camera
        camera = new THREE.PerspectiveCamera( 50, renderWidth / renderHeight, 1, 100 );
        camera.position.set( 0, 20, 0 );
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        controls = new OrbitControls( camera );

        // floor
        planeGeom = new THREE.PlaneGeometry( 100, 100, 1 );
        planeMat = new THREE.MeshPhongMaterial({ color: 0xBBBBBB, emissive: 0x000000, shininess: 0 });
        plane = new THREE.Mesh( planeGeom, planeMat );
        plane.receiveShadow = true;
        plane.rotation.x = THREE.Math.degToRad(270);
        plane.position.set( 0, -1, 0 );
        scene.add( plane );

        // track
        svgPath = 'M307.4,1H81.6C36,1-1,42-1,92.5S36,184,81.6,184h225.8c45.6,0,82.6-41,82.6-91.5S353.1,1,307.4,1zM298,165' +
            'H92.9C51.5,165,18,132.2,18,92.5C18,52.8,51.5,20,92.9,20H298c41.3,0,74.9,32.8,74.9,72.5C372.9,132.2,339.4,165,298,165z';

        trackPath = transformSVGPath( svgPath );
        trackShape = trackPath.toShapes();
        trackMat = new THREE.MeshPhongMaterial({
            color: 0x646466, emissive: 0x7a7a7a, specular: 0x646464, shininess: 0,
        });

        let shape3d = new THREE.ExtrudeBufferGeometry( trackShape, {
            amount: 20,
            steps: 2,
            curveSegments: 100,
            bevelEnabled: false
        } );

        shape3d.scale(0.014, 0.014, 0.014);
        shape3d.center();

        track = new THREE.Mesh( shape3d, trackMat );
        track.rotation.x = THREE.Math.degToRad(90);
        track.position.set( 1.45, -0.9, 0 );
        track.receiveShadow = true;
        track.castShadow = true;
        scene.add( track );

        // sphere
        sphereGeom = new THREE.SphereGeometry( 1, 32, 32 );
        sphereMat = new THREE.MeshPhongMaterial({ color: 0x646466, emissive: 0x7a7a7a, specular: 0x646464, shininess: 9 });
        sphere = new THREE.Mesh( sphereGeom, sphereMat );
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.position.set( 0, 0, 0 );
        scene.add( sphere );
        objects.push( sphere );

        // lights

        hemiLight = new THREE.HemisphereLight( 0xD6D6DF, 0xDDDDDD, 1 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        pointLight = new THREE.DirectionalLight( 0xFFFFFF, 0.4 );
        pointLight.position.set( 15, 20, -20);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        //pointLight.shadow.camera.far = 45;
        scene.add( pointLight );
        //scene.add( new THREE.DirectionalLightHelper( pointLight ) );

        // let shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        // shader = shader.replace(
        //     '#ifdef USE_SHADOWMAP',
        //     '#ifdef USE_SHADOWMAP' +
        //     document.getElementById( 'PCSS' ).textContent
        // );
        // shader = shader.replace(
        //     '#if defined( SHADOWMAP_TYPE_PCF )',
        //     document.getElementById( 'PCSSGetShadow' ).textContent +
        //     '#if defined( SHADOWMAP_TYPE_PCF )'
        // );
        // THREE.ShaderChunk.shadowmap_pars_fragment = shader;

        effectFilm = new THREE_ADDONS.FilmPass( 0.09, 0, 0, false );
        effectFilm.renderToScreen = true;
        let renderScene = new THREE_ADDONS.RenderPass( scene, camera );

        composer = new THREE_ADDONS.EffectComposer( renderer, new THREE.WebGLRenderTarget( renderWidth, renderHeight, rtParameters ) );
        composer.addPass( renderScene );
        // composer.addPass( new THREE_ADDONS.ShaderPass( THREE_ADDONS.CopyShader ) );
        composer.addPass( effectFilm );

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

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

        TWEEN.update();
        controls.update();

        // renderer.render( scene, camera );
        composer.render( delta );
    }

    function onDocumentMouseMove( event ) {

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(objects, true);

        if (intersects.length > 0) {
            document.getElementsByTagName('canvas')[0].style.cursor = 'pointer';
        } else {
            document.getElementsByTagName('canvas')[0].style.cursor = 'default';
        }
    }

    function onDocumentMouseDown( event ) {

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        let intersects = raycaster.intersectObjects(objects, true);

        if (intersects.length > 0) {

            if( !toggleActive ) {

                new TWEEN.Tween( sphere.material.color )
                    .to( new THREE.Color(0x175225), 800 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( sphere.material.emissive )
                    .to( new THREE.Color(0x13500f), 800 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( sphere.material.specular )
                    .to( new THREE.Color(0x2b641a), 800 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( sphere.position )
                    .to({ x: 2.95 }, 1400 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                toggleActive = true;

            } else {

                new TWEEN.Tween( sphere.material.color )
                    .to( new THREE.Color(0x646466), 800 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( sphere.material.emissive )
                    .to( new THREE.Color(0x7a7a7a), 800 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( sphere.material.specular )
                    .to( new THREE.Color(0x646464), 800 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                new TWEEN.Tween( sphere.position )
                    .to({ x: 0 }, 1400 )
                    .easing( TWEEN.Easing.Exponential.InOut )
                    .start();

                toggleActive = false;

            }
        }
    }

    function buildGui() {

        gui = new dat.GUI();
        let params = {
            color: pointLight.color.getHex(),
            intensity: pointLight.intensity,
            sphereColor: sphereMat.color.getHex(),
            sphereEmissive: sphereMat.emissive.getHex(),
            sphereSpecular: sphereMat.specular.getHex(),
            sphereShininess: sphereMat.shininess,
            floorColor: planeMat.color.getHex(),
            floorEmissive: planeMat.emissive.getHex(),
            floorSpecular: planeMat.specular.getHex(),
            floorShininess: planeMat.shininess,
            trackColor: trackMat.color.getHex(),
            trackEmissive: trackMat.emissive.getHex(),
            trackSpecular: trackMat.specular.getHex(),
            trackShininess: trackMat.shininess,
            cameraPosition: 'top down',
            nIntensity: effectFilm.uniforms.nIntensity.value,
            sIntensity: effectFilm.uniforms.sIntensity.value,
            sCount: effectFilm.uniforms.sCount.value,
            noiseEnabled: true
        };

        let lightFolder = gui.addFolder('Light');

        lightFolder.addColor( params, 'color' ).onChange( function ( val ) {
            pointLight.color.setHex( val );
        } );
        lightFolder.add( params, 'intensity', 0, 2 ).onChange( function ( val ) {
            pointLight.intensity = val;
        } );

        let sphereFolder = gui.addFolder('Sphere');

        sphereFolder.addColor( params, 'sphereColor').onChange( function ( val ) {
            sphereMat.color.setHex( val );
        } );

        sphereFolder.addColor( params, 'sphereEmissive').onChange( function ( val ) {
            sphereMat.emissive.setHex( val );
        } );

        sphereFolder.addColor( params, 'sphereSpecular').onChange( function ( val ) {
            sphereMat.specular.setHex( val );
        } );

        sphereFolder.add( params, 'sphereShininess', 0, 50 ).onChange( function ( val ) {
            sphereMat.shininess = val;
        } );

        let trackFolder = gui.addFolder('Track');

        trackFolder.addColor( params, 'trackColor').onChange( function ( val ) {
            trackMat.color.setHex( val );
        } );

        trackFolder.addColor( params, 'trackEmissive').onChange( function ( val ) {
            trackMat.emissive.setHex( val );
        } );

        trackFolder.addColor( params, 'trackSpecular').onChange( function ( val ) {
            trackMat.specular.setHex( val );
        } );

        trackFolder.add( params, 'trackShininess', 0, 50 ).onChange( function ( val ) {
            trackMat.shininess = val;
        } );

        let floorFolder = gui.addFolder('Floor');

        floorFolder.addColor( params, 'floorColor').onChange( function ( val ) {
            planeMat.color.setHex( val );
        } );

        floorFolder.addColor( params, 'floorEmissive').onChange( function ( val ) {
            planeMat.emissive.setHex( val );
        } );

        floorFolder.addColor( params, 'floorSpecular').onChange( function ( val ) {
            planeMat.specular.setHex( val );
        } );

        floorFolder.add( params, 'floorShininess', 0, 50 ).onChange( function ( val ) {
            planeMat.shininess = val;
        } );

        let noiseFolder = gui.addFolder('Noise');

        noiseFolder.add( params, 'nIntensity').onChange( function ( val ) {
            effectFilm.uniforms.nIntensity.value = val;
        } );

        noiseFolder.add( params, 'sIntensity').onChange( function ( val ) {
            effectFilm.uniforms.sIntensity.value = val;
        } );

        noiseFolder.add( params, 'sCount').onChange( function ( val ) {
            effectFilm.uniforms.sCount.value = val;
        } );

        noiseFolder.add( params, 'noiseEnabled' ).onChange( function ( val ) {
            effectFilm.renderToScreen = val;
        } );

        gui.add( params, 'cameraPosition', [ 'top down', 'perspective' ] ).onChange( function ( val ) {

            if( val === 'top down' ) {
                camera.position.set( 0, 20, 0 );
            } else {
                camera.position.set( 10.3, 17.8, 11 );
            }

        });

        gui.close();

        document.getElementsByClassName('main')[0].addEventListener('mouseenter', function() {
            controls.enabled = false;
        }, false);

        document.getElementsByClassName('main')[0].addEventListener('mouseleave', function() {
            controls.enabled = true;
        }, false);
    }

};

sphereToggle();