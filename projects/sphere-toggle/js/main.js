import * as THREE from 'three';
import * as THREE_ADDONS from 'three-addons';
import OrbitControls from 'three-orbitcontrols';
import dat from 'dat.gui';
const TWEEN = require('@tweenjs/tween.js');

const sphereToggle = function() {

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
        gui;

    let composer, renderPass, saoPass, copyPass;

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

        composer = new THREE_ADDONS.EffectComposer( renderer );
        renderPass = new THREE_ADDONS.RenderPass( scene, camera );
        composer.addPass( renderPass );
        saoPass = new THREE.SAOPass( scene, camera, false, true );
        saoPass.renderToScreen = true;
        composer.addPass( saoPass );

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
        //renderer.render( scene, camera );
        composer.render();
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
            output: 0,
            saoBias: 0.5,
            saoIntensity: 0.25,
            saoScale: 1,
            saoKernelRadius: 100,
            saoMinResolution: 0,
            saoBlur: true,
            saoBlurRadius: 12,
            saoBlurStdDev: 6,
            saoBlurDepthCutoff: 0.01
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

        gui.add( params, 'cameraPosition', [ 'top down', 'perspective' ] ).onChange( function ( val ) {

            if( val === 'top down' ) {
                camera.position.set( 0, 20, 0 );
            } else {
                camera.position.set( 10.3, 17.8, 11 );
            }

        });

        gui.add( saoPass.params, 'output', {
            'Beauty': THREE.SAOPass.OUTPUT.Beauty,
            'Beauty+SAO': THREE.SAOPass.OUTPUT.Default,
            'SAO': THREE.SAOPass.OUTPUT.SAO,
            'Depth': THREE.SAOPass.OUTPUT.Depth,
            'Normal': THREE.SAOPass.OUTPUT.Normal
        } ).onChange( function ( value ) { saoPass.params.output = parseInt( value, 10 ); } );
        gui.add( saoPass.params, 'saoBias', - 1, 1 );
        gui.add( saoPass.params, 'saoIntensity', 0, 1 );
        gui.add( saoPass.params, 'saoScale', 0, 10 );
        gui.add( saoPass.params, 'saoKernelRadius', 1, 100 );
        gui.add( saoPass.params, 'saoMinResolution', 0, 1 );
        gui.add( saoPass.params, 'saoBlur' );
        gui.add( saoPass.params, 'saoBlurRadius', 0, 200 );
        gui.add( saoPass.params, 'saoBlurStdDev', 0.5, 150 );
        gui.add( saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.1 );

        gui.close();

        document.getElementsByClassName('main')[0].addEventListener('mouseenter', function() {
            controls.enabled = false;
        }, false);

        document.getElementsByClassName('main')[0].addEventListener('mouseleave', function() {
            controls.enabled = true;
        }, false);
    }

};


function transformSVGPath( pathStr ) {
    let DIGIT_0 = 48, DIGIT_9 = 57, COMMA = 44, SPACE = 32, PERIOD = 46, MINUS = 45;
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

/**
 * @author ludobaka / ludobaka.github.io
 * SAO implementation inspired from bhouston previous SAO work
 */

THREE.SAOPass = function ( scene, camera, depthTexture, useNormals, resolution ) {

    THREE_ADDONS.MaskPass.call( this );

    this.scene = scene;
    this.camera = camera;

    this.clear = true;
    this.needsSwap = false;

    this.supportsDepthTextureExtension = ( depthTexture !== undefined ) ? depthTexture : false;
    this.supportsNormalTexture = ( useNormals !== undefined ) ? useNormals : false;

    this.oldClearColor = new THREE.Color();
    this.oldClearAlpha = 1;

    this.params = {
        output: 0,
        saoBias: 0.5,
        saoIntensity: 0.18,
        saoScale: 1,
        saoKernelRadius: 100,
        saoMinResolution: 0,
        saoBlur: true,
        saoBlurRadius: 8,
        saoBlurStdDev: 4,
        saoBlurDepthCutoff: 0.01
    };

    this.resolution = ( resolution !== undefined ) ? new THREE.Vector2( resolution.x, resolution.y ) : new THREE.Vector2( 256, 256 );

    this.saoRenderTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    } );
    this.blurIntermediateRenderTarget = this.saoRenderTarget.clone();
    this.beautyRenderTarget = this.saoRenderTarget.clone();

    this.normalRenderTarget = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    } );
    this.depthRenderTarget = this.normalRenderTarget.clone();

    if ( this.supportsDepthTextureExtension ) {

        var depthTexture = new THREE.DepthTexture();
        depthTexture.type = THREE.UnsignedShortType;
        depthTexture.minFilter = THREE.NearestFilter;
        depthTexture.maxFilter = THREE.NearestFilter;

        this.beautyRenderTarget.depthTexture = depthTexture;
        this.beautyRenderTarget.depthBuffer = true;

    }

    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.depthMaterial.depthPacking = THREE.RGBADepthPacking;
    this.depthMaterial.blending = THREE.NoBlending;

    this.normalMaterial = new THREE.MeshNormalMaterial();
    this.normalMaterial.blending = THREE.NoBlending;

    if ( THREE.SAOShader === undefined ) {

        console.error( 'THREE.SAOPass relies on THREE.SAOShader' );

    }

    this.saoMaterial = new THREE.ShaderMaterial( {
        defines: Object.assign( {}, THREE.SAOShader.defines ),
        fragmentShader: THREE.SAOShader.fragmentShader,
        vertexShader: THREE.SAOShader.vertexShader,
        uniforms: THREE.UniformsUtils.clone( THREE.SAOShader.uniforms )
    } );
    this.saoMaterial.extensions.derivatives = true;
    this.saoMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
    this.saoMaterial.defines[ 'NORMAL_TEXTURE' ] = this.supportsNormalTexture ? 1 : 0;
    this.saoMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
    this.saoMaterial.uniforms[ 'tDepth' ].value = ( this.supportsDepthTextureExtension ) ? depthTexture : this.depthRenderTarget.texture;
    this.saoMaterial.uniforms[ 'tNormal' ].value = this.normalRenderTarget.texture;
    this.saoMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
    this.saoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );
    this.saoMaterial.uniforms[ 'cameraProjectionMatrix' ].value = this.camera.projectionMatrix;
    this.saoMaterial.blending = THREE.NoBlending;

    if ( THREE.DepthLimitedBlurShader === undefined ) {

        console.error( 'THREE.SAOPass relies on THREE.DepthLimitedBlurShader' );

    }

    this.vBlurMaterial = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.clone( THREE.DepthLimitedBlurShader.uniforms ),
        defines: Object.assign( {}, THREE.DepthLimitedBlurShader.defines ),
        vertexShader: THREE.DepthLimitedBlurShader.vertexShader,
        fragmentShader: THREE.DepthLimitedBlurShader.fragmentShader
    } );
    this.vBlurMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
    this.vBlurMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
    this.vBlurMaterial.uniforms[ 'tDiffuse' ].value = this.saoRenderTarget.texture;
    this.vBlurMaterial.uniforms[ 'tDepth' ].value = ( this.supportsDepthTextureExtension ) ? depthTexture : this.depthRenderTarget.texture;
    this.vBlurMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
    this.vBlurMaterial.blending = THREE.NoBlending;

    this.hBlurMaterial = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.clone( THREE.DepthLimitedBlurShader.uniforms ),
        defines: Object.assign( {}, THREE.DepthLimitedBlurShader.defines ),
        vertexShader: THREE.DepthLimitedBlurShader.vertexShader,
        fragmentShader: THREE.DepthLimitedBlurShader.fragmentShader
    } );
    this.hBlurMaterial.defines[ 'DEPTH_PACKING' ] = this.supportsDepthTextureExtension ? 0 : 1;
    this.hBlurMaterial.defines[ 'PERSPECTIVE_CAMERA' ] = this.camera.isPerspectiveCamera ? 1 : 0;
    this.hBlurMaterial.uniforms[ 'tDiffuse' ].value = this.blurIntermediateRenderTarget.texture;
    this.hBlurMaterial.uniforms[ 'tDepth' ].value = ( this.supportsDepthTextureExtension ) ? depthTexture : this.depthRenderTarget.texture;
    this.hBlurMaterial.uniforms[ 'size' ].value.set( this.resolution.x, this.resolution.y );
    this.hBlurMaterial.blending = THREE.NoBlending;

    if ( THREE_ADDONS.CopyShader === undefined ) {

        console.error( 'THREE.SAOPass relies on THREE_ADDONS.CopyShader' );

    }

    this.materialCopy = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.clone( THREE_ADDONS.CopyShader.uniforms ),
        vertexShader: THREE_ADDONS.CopyShader.vertexShader,
        fragmentShader: THREE_ADDONS.CopyShader.fragmentShader,
        blending: THREE.NoBlending
    } );
    this.materialCopy.transparent = true;
    this.materialCopy.depthTest = false;
    this.materialCopy.depthWrite = false;
    this.materialCopy.blending = THREE.CustomBlending;
    this.materialCopy.blendSrc = THREE.DstColorFactor;
    this.materialCopy.blendDst = THREE.ZeroFactor;
    this.materialCopy.blendEquation = THREE.AddEquation;
    this.materialCopy.blendSrcAlpha = THREE.DstAlphaFactor;
    this.materialCopy.blendDstAlpha = THREE.ZeroFactor;
    this.materialCopy.blendEquationAlpha = THREE.AddEquation;

    if ( THREE_ADDONS.CopyShader === undefined ) {

        console.error( 'THREE.SAOPass relies on THREE.UnpackDepthRGBAShader' );

    }

    this.depthCopy = new THREE.ShaderMaterial( {
        uniforms: THREE.UniformsUtils.clone( THREE_ADDONS.UnpackDepthRGBAShader.uniforms ),
        vertexShader: THREE_ADDONS.UnpackDepthRGBAShader.vertexShader,
        fragmentShader: THREE_ADDONS.UnpackDepthRGBAShader.fragmentShader,
        blending: THREE.NoBlending
    } );

    this.quadCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
    this.quadScene = new THREE.Scene();
    this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
    this.quadScene.add( this.quad );

};

THREE.SAOPass.OUTPUT = {
    'Beauty': 1,
    'Default': 0,
    'SAO': 2,
    'Depth': 3,
    'Normal': 4
};

THREE.SAOPass.prototype = Object.assign( Object.create( THREE_ADDONS.MaskPass.prototype ), {
    constructor: THREE.SAOPass,

    render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

        // Rendering readBuffer first when rendering to screen
        if ( this.renderToScreen ) {

            this.materialCopy.blending = THREE.NoBlending;
            this.materialCopy.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
            this.materialCopy.needsUpdate = true;
            this.renderPass( renderer, this.materialCopy, null );

        }

        if ( this.params.output === 1 ) {

            return;

        }

        this.oldClearColor.copy( renderer.getClearColor() );
        this.oldClearAlpha = renderer.getClearAlpha();
        var oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        renderer.clearTarget( this.depthRenderTarget );

        this.saoMaterial.uniforms[ 'bias' ].value = this.params.saoBias;
        this.saoMaterial.uniforms[ 'intensity' ].value = this.params.saoIntensity;
        this.saoMaterial.uniforms[ 'scale' ].value = this.params.saoScale;
        this.saoMaterial.uniforms[ 'kernelRadius' ].value = this.params.saoKernelRadius;
        this.saoMaterial.uniforms[ 'minResolution' ].value = this.params.saoMinResolution;
        this.saoMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
        this.saoMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
        // this.saoMaterial.uniforms['randomSeed'].value = Math.random();

        var depthCutoff = this.params.saoBlurDepthCutoff * ( this.camera.far - this.camera.near );
        this.vBlurMaterial.uniforms[ 'depthCutoff' ].value = depthCutoff;
        this.hBlurMaterial.uniforms[ 'depthCutoff' ].value = depthCutoff;

        this.vBlurMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
        this.vBlurMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;
        this.hBlurMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
        this.hBlurMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;

        this.params.saoBlurRadius = Math.floor( this.params.saoBlurRadius );
        if ( ( this.prevStdDev !== this.params.saoBlurStdDev ) || ( this.prevNumSamples !== this.params.saoBlurRadius ) ) {

            THREE.BlurShaderUtils.configure( this.vBlurMaterial, this.params.saoBlurRadius, this.params.saoBlurStdDev, new THREE.Vector2( 0, 1 ) );
            THREE.BlurShaderUtils.configure( this.hBlurMaterial, this.params.saoBlurRadius, this.params.saoBlurStdDev, new THREE.Vector2( 1, 0 ) );
            this.prevStdDev = this.params.saoBlurStdDev;
            this.prevNumSamples = this.params.saoBlurRadius;

        }

        // Rendering scene to depth texture
        renderer.setClearColor( 0x000000 );
        renderer.render( this.scene, this.camera, this.beautyRenderTarget, true );

        // Re-render scene if depth texture extension is not supported
        if ( ! this.supportsDepthTextureExtension ) {

            // Clear rule : far clipping plane in both RGBA and Basic encoding
            this.renderOverride( renderer, this.depthMaterial, this.depthRenderTarget, 0x000000, 1.0 );

        }

        if ( this.supportsNormalTexture ) {

            // Clear rule : default normal is facing the camera
            this.renderOverride( renderer, this.normalMaterial, this.normalRenderTarget, 0x7777ff, 1.0 );

        }

        // Rendering SAO texture
        this.renderPass( renderer, this.saoMaterial, this.saoRenderTarget, 0xffffff, 1.0 );

        // Blurring SAO texture
        if ( this.params.saoBlur ) {

            this.renderPass( renderer, this.vBlurMaterial, this.blurIntermediateRenderTarget, 0xffffff, 1.0 );
            this.renderPass( renderer, this.hBlurMaterial, this.saoRenderTarget, 0xffffff, 1.0 );

        }

        var outputMaterial = this.materialCopy;
        // Setting up SAO rendering
        if ( this.params.output === 3 ) {

            if ( this.supportsDepthTextureExtension ) {

                this.materialCopy.uniforms[ 'tDiffuse' ].value = this.beautyRenderTarget.depthTexture;
                this.materialCopy.needsUpdate = true;

            } else {

                this.depthCopy.uniforms[ 'tDiffuse' ].value = this.depthRenderTarget.texture;
                this.depthCopy.needsUpdate = true;
                outputMaterial = this.depthCopy;

            }

        } else if ( this.params.output === 4 ) {

            this.materialCopy.uniforms[ 'tDiffuse' ].value = this.normalRenderTarget.texture;
            this.materialCopy.needsUpdate = true;

        } else {

            this.materialCopy.uniforms[ 'tDiffuse' ].value = this.saoRenderTarget.texture;
            this.materialCopy.needsUpdate = true;

        }

        // Blending depends on output, only want a CustomBlending when showing SAO
        if ( this.params.output === 0 ) {

            outputMaterial.blending = THREE.CustomBlending;

        } else {

            outputMaterial.blending = THREE.NoBlending;

        }

        // Rendering SAOPass result on top of previous pass
        this.renderPass( renderer, outputMaterial, this.renderToScreen ? null : readBuffer );

        renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );
        renderer.autoClear = oldAutoClear;

    },

    renderPass: function ( renderer, passMaterial, renderTarget, clearColor, clearAlpha ) {

        // save original state
        var originalClearColor = renderer.getClearColor();
        var originalClearAlpha = renderer.getClearAlpha();
        var originalAutoClear = renderer.autoClear;

        // setup pass state
        renderer.autoClear = false;
        var clearNeeded = ( clearColor !== undefined ) && ( clearColor !== null );
        if ( clearNeeded ) {

            renderer.setClearColor( clearColor );
            renderer.setClearAlpha( clearAlpha || 0.0 );

        }

        this.quad.material = passMaterial;
        renderer.render( this.quadScene, this.quadCamera, renderTarget, clearNeeded );

        // restore original state
        renderer.autoClear = originalAutoClear;
        renderer.setClearColor( originalClearColor );
        renderer.setClearAlpha( originalClearAlpha );

    },

    renderOverride: function ( renderer, overrideMaterial, renderTarget, clearColor, clearAlpha ) {

        var originalClearColor = renderer.getClearColor();
        var originalClearAlpha = renderer.getClearAlpha();
        var originalAutoClear = renderer.autoClear;

        renderer.autoClear = false;

        clearColor = overrideMaterial.clearColor || clearColor;
        clearAlpha = overrideMaterial.clearAlpha || clearAlpha;
        var clearNeeded = ( clearColor !== undefined ) && ( clearColor !== null );
        if ( clearNeeded ) {

            renderer.setClearColor( clearColor );
            renderer.setClearAlpha( clearAlpha || 0.0 );

        }

        this.scene.overrideMaterial = overrideMaterial;
        renderer.render( this.scene, this.camera, renderTarget, clearNeeded );
        this.scene.overrideMaterial = null;

        // restore original state
        renderer.autoClear = originalAutoClear;
        renderer.setClearColor( originalClearColor );
        renderer.setClearAlpha( originalClearAlpha );

    },

    setSize: function ( width, height ) {

        this.beautyRenderTarget.setSize( width, height );
        this.saoRenderTarget.setSize( width, height );
        this.blurIntermediateRenderTarget.setSize( width, height );
        this.normalRenderTarget.setSize( width, height );
        this.depthRenderTarget.setSize( width, height );

        this.saoMaterial.uniforms[ 'size' ].value.set( width, height );
        this.saoMaterial.uniforms[ 'cameraInverseProjectionMatrix' ].value.getInverse( this.camera.projectionMatrix );
        this.saoMaterial.uniforms[ 'cameraProjectionMatrix' ].value = this.camera.projectionMatrix;
        this.saoMaterial.needsUpdate = true;

        this.vBlurMaterial.uniforms[ 'size' ].value.set( width, height );
        this.vBlurMaterial.needsUpdate = true;

        this.hBlurMaterial.uniforms[ 'size' ].value.set( width, height );
        this.hBlurMaterial.needsUpdate = true;

    }

} );

THREE.SAOShader = {
    defines: {
        'NUM_SAMPLES': 7,
        'NUM_RINGS': 4,
        'NORMAL_TEXTURE': 0,
        'DIFFUSE_TEXTURE': 0,
        'DEPTH_PACKING': 1,
        'PERSPECTIVE_CAMERA': 1
    },
    uniforms: {

        'tDepth': { type: 't', value: null },
        'tDiffuse': { type: 't', value: null },
        'tNormal': { type: 't', value: null },
        'size': { type: 'v2', value: new THREE.Vector2( 512, 512 ) },

        'cameraNear': { type: 'f', value: 1 },
        'cameraFar': { type: 'f', value: 100 },
        'cameraProjectionMatrix': { type: 'm4', value: new THREE.Matrix4() },
        'cameraInverseProjectionMatrix': { type: 'm4', value: new THREE.Matrix4() },

        'scale': { type: 'f', value: 1.0 },
        'intensity': { type: 'f', value: 0.1 },
        'bias': { type: 'f', value: 0.5 },

        'minResolution': { type: 'f', value: 0.0 },
        'kernelRadius': { type: 'f', value: 100.0 },
        'randomSeed': { type: 'f', value: 0.0 }
    },
    vertexShader: [
        "varying vec2 vUv;",

        "void main() {",
        "	vUv = uv;",
        "	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"

    ].join( "\n" ),
    fragmentShader: [
        "#include <common>",

        "varying vec2 vUv;",

        "#if DIFFUSE_TEXTURE == 1",
        "uniform sampler2D tDiffuse;",
        "#endif",

        "uniform sampler2D tDepth;",

        "#if NORMAL_TEXTURE == 1",
        "uniform sampler2D tNormal;",
        "#endif",

        "uniform float cameraNear;",
        "uniform float cameraFar;",
        "uniform mat4 cameraProjectionMatrix;",
        "uniform mat4 cameraInverseProjectionMatrix;",

        "uniform float scale;",
        "uniform float intensity;",
        "uniform float bias;",
        "uniform float kernelRadius;",
        "uniform float minResolution;",
        "uniform vec2 size;",
        "uniform float randomSeed;",

        "// RGBA depth",

        "#include <packing>",

        "vec4 getDefaultColor( const in vec2 screenPosition ) {",
        "	#if DIFFUSE_TEXTURE == 1",
        "	return texture2D( tDiffuse, vUv );",
        "	#else",
        "	return vec4( 1.0 );",
        "	#endif",
        "}",

        "float getDepth( const in vec2 screenPosition ) {",
        "	#if DEPTH_PACKING == 1",
        "	return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );",
        "	#else",
        "	return texture2D( tDepth, screenPosition ).x;",
        "	#endif",
        "}",

        "float getViewZ( const in float depth ) {",
        "	#if PERSPECTIVE_CAMERA == 1",
        "	return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );",
        "	#else",
        "	return orthographicDepthToViewZ( depth, cameraNear, cameraFar );",
        "	#endif",
        "}",

        "vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {",
        "	float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];",
        "	vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );",
        "	clipPosition *= clipW; // unprojection.",

        "	return ( cameraInverseProjectionMatrix * clipPosition ).xyz;",
        "}",

        "vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition ) {",
        "	#if NORMAL_TEXTURE == 1",
        "	return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );",
        "	#else",
        "	return normalize( cross( dFdx( viewPosition ), dFdy( viewPosition ) ) );",
        "	#endif",
        "}",

        "float scaleDividedByCameraFar;",
        "float minResolutionMultipliedByCameraFar;",

        "float getOcclusion( const in vec3 centerViewPosition, const in vec3 centerViewNormal, const in vec3 sampleViewPosition ) {",
        "	vec3 viewDelta = sampleViewPosition - centerViewPosition;",
        "	float viewDistance = length( viewDelta );",
        "	float scaledScreenDistance = scaleDividedByCameraFar * viewDistance;",

        "	return max(0.0, (dot(centerViewNormal, viewDelta) - minResolutionMultipliedByCameraFar) / scaledScreenDistance - bias) / (1.0 + pow2( scaledScreenDistance ) );",
        "}",

        "// moving costly divides into consts",
        "const float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );",
        "const float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );",

        "float getAmbientOcclusion( const in vec3 centerViewPosition ) {",
        "	// precompute some variables require in getOcclusion.",
        "	scaleDividedByCameraFar = scale / cameraFar;",
        "	minResolutionMultipliedByCameraFar = minResolution * cameraFar;",
        "	vec3 centerViewNormal = getViewNormal( centerViewPosition, vUv );",

        "	// jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/",
        "	float angle = rand( vUv + randomSeed ) * PI2;",
        "	vec2 radius = vec2( kernelRadius * INV_NUM_SAMPLES ) / size;",
        "	vec2 radiusStep = radius;",

        "	float occlusionSum = 0.0;",
        "	float weightSum = 0.0;",

        "	for( int i = 0; i < NUM_SAMPLES; i ++ ) {",
        "		vec2 sampleUv = vUv + vec2( cos( angle ), sin( angle ) ) * radius;",
        "		radius += radiusStep;",
        "		angle += ANGLE_STEP;",

        "		float sampleDepth = getDepth( sampleUv );",
        "		if( sampleDepth >= ( 1.0 - EPSILON ) ) {",
        "			continue;",
        "		}",

        "		float sampleViewZ = getViewZ( sampleDepth );",
        "		vec3 sampleViewPosition = getViewPosition( sampleUv, sampleDepth, sampleViewZ );",
        "		occlusionSum += getOcclusion( centerViewPosition, centerViewNormal, sampleViewPosition );",
        "		weightSum += 1.0;",
        "	}",

        "	if( weightSum == 0.0 ) discard;",

        "	return occlusionSum * ( intensity / weightSum );",
        "}",


        "void main() {",
        "	float centerDepth = getDepth( vUv );",
        "	if( centerDepth >= ( 1.0 - EPSILON ) ) {",
        "		discard;",
        "	}",

        "	float centerViewZ = getViewZ( centerDepth );",
        "	vec3 viewPosition = getViewPosition( vUv, centerDepth, centerViewZ );",

        "	float ambientOcclusion = getAmbientOcclusion( viewPosition );",

        "	gl_FragColor = getDefaultColor( vUv );",
        "	gl_FragColor.xyz *=  1.0 - ambientOcclusion;",
        "}"
    ].join( "\n" )
};

THREE.DepthLimitedBlurShader = {
    defines: {
        'KERNEL_RADIUS': 4,
        'DEPTH_PACKING': 1,
        'PERSPECTIVE_CAMERA': 1
    },
    uniforms: {
        'tDiffuse': { type: 't', value: null },
        'size': { type: 'v2', value: new THREE.Vector2( 512, 512 ) },
        'sampleUvOffsets': { type: 'v2v', value: [ new THREE.Vector2( 0, 0 ) ] },
        'sampleWeights': { type: '1fv', value: [ 1.0 ] },
        'tDepth': { type: 't', value: null },
        'cameraNear': { type: 'f', value: 10 },
        'cameraFar': { type: 'f', value: 1000 },
        'depthCutoff': { type: 'f', value: 10 },
    },
    vertexShader: [
        "#include <common>",

        "uniform vec2 size;",

        "varying vec2 vUv;",
        "varying vec2 vInvSize;",

        "void main() {",
        "	vUv = uv;",
        "	vInvSize = 1.0 / size;",

        "	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"

    ].join( "\n" ),
    fragmentShader: [
        "#include <common>",
        "#include <packing>",

        "uniform sampler2D tDiffuse;",
        "uniform sampler2D tDepth;",

        "uniform float cameraNear;",
        "uniform float cameraFar;",
        "uniform float depthCutoff;",

        "uniform vec2 sampleUvOffsets[ KERNEL_RADIUS + 1 ];",
        "uniform float sampleWeights[ KERNEL_RADIUS + 1 ];",

        "varying vec2 vUv;",
        "varying vec2 vInvSize;",

        "float getDepth( const in vec2 screenPosition ) {",
        "	#if DEPTH_PACKING == 1",
        "	return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );",
        "	#else",
        "	return texture2D( tDepth, screenPosition ).x;",
        "	#endif",
        "}",

        "float getViewZ( const in float depth ) {",
        "	#if PERSPECTIVE_CAMERA == 1",
        "	return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );",
        "	#else",
        "	return orthographicDepthToViewZ( depth, cameraNear, cameraFar );",
        "	#endif",
        "}",

        "void main() {",
        "	float depth = getDepth( vUv );",
        "	if( depth >= ( 1.0 - EPSILON ) ) {",
        "		discard;",
        "	}",

        "	float centerViewZ = -getViewZ( depth );",
        "	bool rBreak = false, lBreak = false;",

        "	float weightSum = sampleWeights[0];",
        "	vec4 diffuseSum = texture2D( tDiffuse, vUv ) * weightSum;",

        "	for( int i = 1; i <= KERNEL_RADIUS; i ++ ) {",

        "		float sampleWeight = sampleWeights[i];",
        "		vec2 sampleUvOffset = sampleUvOffsets[i] * vInvSize;",

        "		vec2 sampleUv = vUv + sampleUvOffset;",
        "		float viewZ = -getViewZ( getDepth( sampleUv ) );",

        "		if( abs( viewZ - centerViewZ ) > depthCutoff ) rBreak = true;",

        "		if( ! rBreak ) {",
        "			diffuseSum += texture2D( tDiffuse, sampleUv ) * sampleWeight;",
        "			weightSum += sampleWeight;",
        "		}",

        "		sampleUv = vUv - sampleUvOffset;",
        "		viewZ = -getViewZ( getDepth( sampleUv ) );",

        "		if( abs( viewZ - centerViewZ ) > depthCutoff ) lBreak = true;",

        "		if( ! lBreak ) {",
        "			diffuseSum += texture2D( tDiffuse, sampleUv ) * sampleWeight;",
        "			weightSum += sampleWeight;",
        "		}",

        "	}",

        "	gl_FragColor = diffuseSum / weightSum;",
        "}"
    ].join( "\n" )
};

THREE.BlurShaderUtils = {

    createSampleWeights: function ( kernelRadius, stdDev ) {

        var gaussian = function ( x, stdDev ) {

            return Math.exp( - ( x * x ) / ( 2.0 * ( stdDev * stdDev ) ) ) / ( Math.sqrt( 2.0 * Math.PI ) * stdDev );

        };

        var weights = [];

        for ( var i = 0; i <= kernelRadius; i ++ ) {

            weights.push( gaussian( i, stdDev ) );

        }

        return weights;

    },

    createSampleOffsets: function ( kernelRadius, uvIncrement ) {

        var offsets = [];

        for ( var i = 0; i <= kernelRadius; i ++ ) {

            offsets.push( uvIncrement.clone().multiplyScalar( i ) );

        }

        return offsets;

    },

    configure: function ( material, kernelRadius, stdDev, uvIncrement ) {

        material.defines[ 'KERNEL_RADIUS' ] = kernelRadius;
        material.uniforms[ 'sampleUvOffsets' ].value = THREE.BlurShaderUtils.createSampleOffsets( kernelRadius, uvIncrement );
        material.uniforms[ 'sampleWeights' ].value = THREE.BlurShaderUtils.createSampleWeights( kernelRadius, stdDev );
        material.needsUpdate = true;

    }

};

sphereToggle();