import * as THREE from 'three';
import { TweenLite } from 'gsap';

const displacementSlider = function(opts) {

    let vertex = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `;

    let fragment = `
        varying vec2 vUv;

        uniform sampler2D currentImage;
        uniform sampler2D nextImage;

        uniform float dispFactor;

        void main() {

            vec2 uv = vUv;
            vec4 _currentImage;
            vec4 _nextImage;
            float intensity = 0.3;

            vec4 orig1 = texture2D(currentImage, uv);
            vec4 orig2 = texture2D(nextImage, uv);

            _currentImage = texture2D(currentImage, vec2(uv.x, uv.y + dispFactor * (orig2.y * intensity)));

            _nextImage = texture2D(nextImage, vec2(uv.x, uv.y + (1.0 - dispFactor) * (orig1.y * intensity)));

            vec4 finalTexture = mix(_currentImage, _nextImage, dispFactor);

            gl_FragColor = finalTexture;

        }
    `;

    let images = opts.images, image, sliderImages = [];;
    let canvasWidth = images[0].clientWidth;
    let canvasHeight = images[0].clientHeight;
    let parent = opts.parent;
    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    let renderer = new THREE.WebGLRenderer({
        antialias: false,
    });

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x24272A, 1.0 );
    renderer.setSize( canvasWidth, canvasHeight );
    parent.appendChild( renderer.domElement );

    let loader = new THREE.TextureLoader();
    loader.crossOrigin = "";

    images.forEach( ( img ) => {

        image = loader.load( img.getAttribute( 'src' ) );
        image.magFilter = image.minFilter = THREE.LinearFilter;
        image.anisotropy = renderer.capabilities.getMaxAnisotropy();
        sliderImages.push( image );

    });

    let scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x24272A );
    let camera = new THREE.OrthographicCamera(
        renderWidth / -2,
        renderWidth / 2,
        renderHeight / 2,
        renderHeight / -2,
        1,
        1000
    );

    camera.position.z = 1;

    let mat = new THREE.ShaderMaterial({
        uniforms: {
            dispFactor: { type: "f", value: 0.0 },
            currentImage: { type: "t", value: sliderImages[0] },
            nextImage: { type: "t", value: sliderImages[1] },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        opacity: 1.0
    });

    let geometry = new THREE.PlaneBufferGeometry(
        parent.offsetWidth,
        parent.offsetHeight,
        1
    );
    let object = new THREE.Mesh(geometry, mat);
    object.position.set(0, 0, 0);
    scene.add(object);

    let addEvents = function(){

        let pagButtons = Array.from(document.getElementById('pagination').querySelectorAll('button'));

        pagButtons.forEach( (el) => {

            el.addEventListener('click', function(e) {

                document.getElementById('pagination').querySelectorAll('.active')[0].className = '';
                this.className = 'active';

                let slideId = parseInt( this.dataset.slide, 10 );

                mat.uniforms.nextImage.value = sliderImages[ slideId ];
                mat.uniforms.nextImage.needsUpdate = true;

                TweenLite.to(mat.uniforms.dispFactor, 1.2, {
                    value: 1,
                    ease: 'Expo.easeInOut',
                    onComplete: function() {
                        mat.uniforms.currentImage.value = sliderImages[ slideId ];
                        mat.uniforms.currentImage.needsUpdate = true;
                        mat.uniforms.dispFactor.value = 0.0;
                    }
                });

                let slideTitleEl = document.getElementById('slide-title');
                let nextSlideTitle = document.querySelectorAll(`[data-slide-title="${slideId}"]`)[0].innerHTML;

                TweenLite.fromTo( slideTitleEl, 0.6,
                {
                    autoAlpha: 1,
                    filter: 'blur(0px)',
                    y: 0
                },
                {
                    autoAlpha: 0,
                    filter: 'blur(10px)',
                    y: 20,
                    //ease: 'Expo.easeInOut',
                    onComplete: function() {
                        slideTitleEl.innerHTML = nextSlideTitle;

                        TweenLite.to( slideTitleEl, 0.6, {
                            autoAlpha: 1,
                            filter: 'blur(0px)',
                            y: 0,
                            //ease: 'Expo.easeInOut'
                        })
                    }
                });

            });

        });

    };

    addEvents();

    window.addEventListener("resize", function(e) {
        renderer.setSize(canvasWidth, canvasHeight);
    });

    let animate = function() {
        requestAnimationFrame(animate);

        renderer.render(scene, camera);
    };
    animate();
};

export default displacementSlider;