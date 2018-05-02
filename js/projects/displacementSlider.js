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

        uniform sampler2D texture;
        uniform sampler2D texture2;
        uniform sampler2D texture3;

        uniform float dispFactor;
        uniform float effectFactor;

        void main() {

            vec2 uv = vUv;
            vec4 _texture;
            vec4 _texture2;
            vec4 _texture3;
            float intensity = 0.1;

            vec4 orig1 = texture2D(texture, uv);
            vec4 orig2 = texture2D(texture2, uv);

            vec2 distortedPosition = vec2(uv.x, uv.y + dispFactor * (orig2.r*0.8));
            vec2 distortedPosition2 = vec2(uv.x - (1.0 - dispFactor) * (orig1.y * 0.8), uv.y);

            //vec4 _texture = texture2D(texture, distortedPosition);
            //vec4 _texture2 = texture2D(texture2, distortedPosition2);

            if( orig2.y > 0.1) {
                _texture = texture2D(texture, vec2(uv.x, uv.y - dispFactor * (orig2.r * intensity)));
            } else {
                _texture = texture2D(texture, vec2(uv.x, uv.y + dispFactor * (orig2.r * intensity)));
            }

            if( orig1.y > 0.1) {
                _texture2 = texture2D(texture2, vec2(uv.x, uv.y - (1.0 - dispFactor) * (orig1.b * intensity)));
            } else {
                _texture2 = texture2D(texture2, vec2(uv.x, uv.y + (1.0 - dispFactor) * (orig1.b * intensity)));
            }

            vec4 finalTexture = mix(_texture, _texture2, dispFactor);

            gl_FragColor = orig1;

        }
    `;

    let images = opts.images;

    let image1 = images[0].getAttribute('src');
    let image2 = images[1].getAttribute('src');
    let image3 = images[2].getAttribute('src');

    let imageWidth = images[0].clientWidth;
    let imageHeight = images[0].clientHeight;

    let parent = opts.parent;

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    let renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

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

    let renderer = new THREE.WebGLRenderer({
        antialias: false,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x24272A, 1.0);
    renderer.setSize(imageWidth, imageHeight);
    parent.appendChild(renderer.domElement);

    let loader = new THREE.TextureLoader();
    loader.crossOrigin = "";
    let texture1 = loader.load(image1);
    let texture2 = loader.load(image2);
    let texture3 = loader.load(image3);

    texture1.magFilter = texture2.magFilter = THREE.LinearFilter;
    texture1.minFilter = texture2.minFilter = THREE.LinearFilter;

    texture1.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture2.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture3.anisotropy = renderer.capabilities.getMaxAnisotropy();

    let mat = new THREE.ShaderMaterial({
        uniforms: {
            effectFactor: { type: "f", value: 0.5 },
            dispFactor: { type: "f", value: 0.0 },
            texture: { type: "t", value: texture1 },
            texture2: { type: "t", value: texture2 },
            texture3: { type: "t", value: texture3 }
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

                let slideId = this.dataset.slide;

                document.getElementById('pagination').querySelectorAll('.active')[0].className = '';

                this.className = 'active';

                if( slideId === '2') {

                    TweenLite.to(mat.uniforms.dispFactor, 1.2, {
                        value: 1,
                        ease: 'Expo.easeInOut'
                    });

                } else {

                    TweenLite.to(mat.uniforms.dispFactor, 1.2, {
                        value: 0,
                        ease: 'Expo.easeInOut'
                    });

                }

            });

        });

    };

    addEvents();

    window.addEventListener("resize", function(e) {
        renderer.setSize(imageWidth, imageHeight);
    });

    let animate = function() {
        requestAnimationFrame(animate);

        renderer.render(scene, camera);
    };
    animate();
};

export default displacementSlider;