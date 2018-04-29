import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
const TWEEN = require('@tweenjs/tween.js');

const sphereToggle = function() {

    function d3threeD( exports ) {
        var DEGS_TO_RADS = Math.PI / 180, UNIT_SIZE = 100;
        var DIGIT_0 = 48, DIGIT_9 = 57, COMMA = 44, SPACE = 32, PERIOD = 46, MINUS = 45;
        exports.transformSVGPath = function transformSVGPath( pathStr ) {
            var path = new THREE.ShapePath();
            var idx = 1, len = pathStr.length, activeCmd,
                x = 0, y = 0, nx = 0, ny = 0, firstX = null, firstY = null,
                x1 = 0, x2 = 0, y1 = 0, y2 = 0,
                rx = 0, ry = 0, xar = 0, laf = 0, sf = 0, cx, cy;
            function eatNum() {
                var sidx, c, isFloat = false, s;
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
                    return isFloat ? parseFloat( s ) : parseInt( s );
                }
                s = pathStr.substring( sidx );
                return isFloat ? parseFloat( s ) : parseInt( s );
            }
            function nextIsNum() {
                var c;
                // do permanently eat any delims...
                while ( idx < len ) {
                    c = pathStr.charCodeAt( idx );
                    if ( c !== COMMA && c !== SPACE ) break;
                    idx ++;
                }
                c = pathStr.charCodeAt( idx );
                return ( c === MINUS || ( DIGIT_0 <= c && c <= DIGIT_9 ) );
            }
            var canRepeat;
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
    }

    var $d3g = {};
    d3threeD( $d3g );

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        scene, camera, renderer, controls,
        plane, planeGeom, planeMat,
        sphere, sphereGeom, sphereMat,
        track,
        objects = [],
        mouse = new THREE.Vector2(),
        raycaster = new THREE.Raycaster();


    init();
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
        camera.position.set(0, 20, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        controls = new OrbitControls( camera );

        //scene.add( new THREE.GridHelper( 50, 50 ) );

        //scene.add( new THREE.AxesHelper( 10 ) );

        // floor
        planeGeom = new THREE.PlaneGeometry( 100, 100, 1 );
        planeMat = new THREE.MeshPhongMaterial({ color: 0xDDDDDD, emissive: 0x000000, shininess: 0 });
        plane = new THREE.Mesh( planeGeom, planeMat );
        plane.receiveShadow = true;
        plane.rotation.x = THREE.Math.degToRad(270);
        plane.position.set( 0, -1, 0 );
        scene.add( plane );

        let svgPath = 'M307.4,1H81.6C36,1-1,42-1,92.5S36,184,81.6,184h225.8c45.6,0,82.6-41,82.6-91.5S353.1,1,307.4,1zM298,165' +
        'H92.9C51.5,165,18,132.2,18,92.5C18,52.8,51.5,20,92.9,20H298c41.3,0,74.9,32.8,74.9,72.5C372.9,132.2,339.4,165,298,165z';

        let path = $d3g.transformSVGPath( svgPath );
        let simpleShape = path.toShapes( );
        // track
        const material = new THREE.MeshPhongMaterial({
            color: 0x808087, emissive: 0x808087, specular: 0x808087, shininess: 10,
        });

        let shape3d = new THREE.ExtrudeBufferGeometry( simpleShape, {
            amount: 20,
            steps: 2,
            curveSegments: 100,
            bevelEnabled: false
        } );

        shape3d.scale(0.014, 0.014, 0.014);
        shape3d.center();

        track = new THREE.Mesh( shape3d, material );
        track.rotation.x = THREE.Math.degToRad(90);
        track.position.set( 1.45, -0.9, 0 );
        track.receiveShadow = true;
        track.castShadow = true;
        scene.add( track );

        // sphere
        sphereGeom = new THREE.SphereGeometry( 1, 32, 32 );
        sphereMat = new THREE.MeshPhongMaterial({ color: 0x808087, emissive: 0x808087, specular: 0x808087, shininess: 10 });
        sphere = new THREE.Mesh( sphereGeom, sphereMat );
        sphere.receiveShadow = true;
        sphere.castShadow = true;
        sphere.position.set( 0, 0, 0 );
        scene.add( sphere );
        objects.push( sphere );

        // lights

        const hemiLight = new THREE.HemisphereLight( 0xD6D6DF, 0xDDDDDD, 1 );
        //hemiLight.color.setHSL( 240, 0.15, 0.88 );
        //hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        const pointLight = new THREE.DirectionalLight( 0xFFFFFF, 0.4 );
        pointLight.position.set( 15, 20, -20);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        //pointLight.shadow.camera.far = 45;
        scene.add( pointLight );
        //scene.add( new THREE.DirectionalLightHelper( pointLight ) );

        var shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        shader = shader.replace(
            '#ifdef USE_SHADOWMAP',
            '#ifdef USE_SHADOWMAP' +
            document.getElementById( 'PCSS' ).textContent
        );
        shader = shader.replace(
            '#if defined( SHADOWMAP_TYPE_PCF )',
            document.getElementById( 'PCSSGetShadow' ).textContent +
            '#if defined( SHADOWMAP_TYPE_PCF )'
        );
        //THREE.ShaderChunk.shadowmap_pars_fragment = shader;

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );

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

        renderer.render( scene, camera );

    }

    function onDocumentMouseDown( event ) {

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects(objects, true);
        if (intersects.length > 0) {

            console.log('t');

            var target = new THREE.Vector3(2.95, 0, 0); // create on init
            animateVector3(sphere.position, target, {

                duration: 800,

                easing : TWEEN.Easing.Exponential.InOut,

                update: function(d) {
                    console.log("Updating: " + d);
                },

                callback : function(){
                    console.log("Completed");
                }
            });
        }
    }

    function animateVector3(vectorToAnimate, target, options){

        options = options || {};
        // get targets from options or set to defaults
        var to = target || THREE.Vector3(),
            easing = options.easing || TWEEN.Easing.Quadratic.In,
            duration = options.duration || 2000;
        // create the tween
        var tweenVector3 = new TWEEN.Tween(vectorToAnimate)
            .to({ x: to.x, y: to.y, z: to.z, }, duration)
            .easing(easing)
            .onUpdate(function(d) {
                if(options.update){
                    options.update(d);
                }
            })
            .onComplete(function(){
                if(options.callback) options.callback();
            });
        // start the tween
        tweenVector3.start();
        // return the tween in case we want to manipulate it later on
        return tweenVector3;
    }

};

export default sphereToggle;
