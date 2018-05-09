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
    
        vec4 mod289(vec4 x)
        {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        vec4 permute(vec4 x)
        {
          return mod289(((x*34.0)+1.0)*x);
        }
        
        vec4 taylorInvSqrt(vec4 r)
        {
          return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        vec2 fade(vec2 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }
        
        // Classic Perlin noise
        float cnoise(vec2 P)
        {
          vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
          vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
          Pi = mod289(Pi); // To avoid truncation effects in permutation
          vec4 ix = Pi.xzxz;
          vec4 iy = Pi.yyww;
          vec4 fx = Pf.xzxz;
          vec4 fy = Pf.yyww;
        
          vec4 i = permute(permute(ix) + iy);
        
          vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
          vec4 gy = abs(gx) - 0.5 ;
          vec4 tx = floor(gx + 0.5);
          gx = gx - tx;
        
          vec2 g00 = vec2(gx.x,gy.x);
          vec2 g10 = vec2(gx.y,gy.y);
          vec2 g01 = vec2(gx.z,gy.z);
          vec2 g11 = vec2(gx.w,gy.w);
        
          vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
          g00 *= norm.x;  
          g01 *= norm.y;  
          g10 *= norm.z;  
          g11 *= norm.w;  
        
          float n00 = dot(g00, vec2(fx.x, fy.x));
          float n10 = dot(g10, vec2(fx.y, fy.y));
          float n01 = dot(g01, vec2(fx.z, fy.z));
          float n11 = dot(g11, vec2(fx.w, fy.w));
        
          vec2 fade_xy = fade(Pf.xy);
          vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
          float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
          return 2.3 * n_xy;
        }
        
        // Classic Perlin noise, periodic variant
        float pnoise(vec2 P, vec2 rep)
        {
          vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
          vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
          Pi = mod(Pi, rep.xyxy); // To create noise with explicit period
          Pi = mod289(Pi);        // To avoid truncation effects in permutation
          vec4 ix = Pi.xzxz;
          vec4 iy = Pi.yyww;
          vec4 fx = Pf.xzxz;
          vec4 fy = Pf.yyww;
        
          vec4 i = permute(permute(ix) + iy);
        
          vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
          vec4 gy = abs(gx) - 0.5 ;
          vec4 tx = floor(gx + 0.5);
          gx = gx - tx;
        
          vec2 g00 = vec2(gx.x,gy.x);
          vec2 g10 = vec2(gx.y,gy.y);
          vec2 g01 = vec2(gx.z,gy.z);
          vec2 g11 = vec2(gx.w,gy.w);
        
          vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
          g00 *= norm.x;  
          g01 *= norm.y;  
          g10 *= norm.z;  
          g11 *= norm.w;  
        
          float n00 = dot(g00, vec2(fx.x, fy.x));
          float n10 = dot(g10, vec2(fx.y, fy.y));
          float n01 = dot(g01, vec2(fx.z, fy.z));
          float n11 = dot(g11, vec2(fx.w, fy.w));
        
          vec2 fade_xy = fade(Pf.xy);
          vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
          float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
          return 2.3 * n_xy;
        }
    
        varying vec2 vUv;

        uniform sampler2D currentImage;
        uniform sampler2D nextImage;

        uniform float dispFactor;

        void main() {

            vec2 uv = vUv;
            vec4 _currentImage;
            vec4 _nextImage;
            //float intensity = 0.3;

            vec4 orig1 = texture2D(currentImage, uv);
            vec4 orig2 = texture2D(nextImage, uv);
            
            float intensity = pnoise(1.5 - uv, vec2(1.0, 1.0));
            
            //if(uv.x < 0.48) {
            //    intensity = 0.9;
            //}

            _currentImage = texture2D(currentImage, vec2(uv.x + dispFactor * (orig2.x * intensity), uv.y + dispFactor * (orig2 * intensity)));

            _nextImage = texture2D(nextImage, vec2(uv.x - (1.0 - dispFactor) * (orig1.x * intensity), uv.y - (1.0 - dispFactor) * (orig1 * intensity)));

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

    let renderW, renderH;

    if( renderWidth > canvasWidth ) {
        renderW = renderWidth;
    } else {
        renderW = canvasWidth;
    }

    renderH = canvasHeight;

    let renderer = new THREE.WebGLRenderer({
        antialias: false,
    });

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x23272A, 1.0 );
    renderer.setSize( renderW, renderH );
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
    scene.background = new THREE.Color( 0x23272A );
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
        let isAnimating = false;

        pagButtons.forEach( (el) => {

            el.addEventListener('click', function() {

                if( !isAnimating ) {

                    isAnimating = true;

                    document.getElementById('pagination').querySelectorAll('.active')[0].className = '';
                    this.className = 'active';

                    let slideId = parseInt( this.dataset.slide, 10 );

                    mat.uniforms.nextImage.value = sliderImages[slideId];
                    mat.uniforms.nextImage.needsUpdate = true;

                    TweenLite.to( mat.uniforms.dispFactor, 1, {
                        value: 1,
                        ease: 'Expo.easeInOut',
                        onComplete: function () {
                            mat.uniforms.currentImage.value = sliderImages[slideId];
                            mat.uniforms.currentImage.needsUpdate = true;
                            mat.uniforms.dispFactor.value = 0.0;
                            isAnimating = false;
                        }
                    });

                    let slideTitleEl = document.getElementById('slide-title');
                    let slideStatusEl = document.getElementById('slide-status');
                    let nextSlideTitle = document.querySelectorAll(`[data-slide-title="${slideId}"]`)[0].innerHTML;
                    let nextSlideStatus = document.querySelectorAll(`[data-slide-status="${slideId}"]`)[0].innerHTML;

                    TweenLite.fromTo( slideTitleEl, 0.5,
                        {
                            autoAlpha: 1,
                            filter: 'blur(0px)',
                            y: 0
                        },
                        {
                            autoAlpha: 0,
                            filter: 'blur(10px)',
                            y: 20,
                            ease: 'Expo.easeIn',
                            onComplete: function () {
                                slideTitleEl.innerHTML = nextSlideTitle;

                                TweenLite.to( slideTitleEl, 0.5, {
                                    autoAlpha: 1,
                                    filter: 'blur(0px)',
                                    y: 0,
                                })
                            }
                        });

                    TweenLite.fromTo( slideStatusEl, 0.5,
                        {
                            autoAlpha: 1,
                            filter: 'blur(0px)',
                            y: 0
                        },
                        {
                            autoAlpha: 0,
                            filter: 'blur(10px)',
                            y: 20,
                            ease: 'Expo.easeIn',
                            onComplete: function () {
                                slideStatusEl.innerHTML = nextSlideStatus;

                                TweenLite.to( slideStatusEl, 0.5, {
                                    autoAlpha: 1,
                                    filter: 'blur(0px)',
                                    y: 0,
                                })
                            }
                        });

                }

            });

        });

    };

    addEvents();

    window.addEventListener( 'resize' , function(e) {
        renderer.setSize(renderW, renderH);
    });

    let animate = function() {
        requestAnimationFrame(animate);

        renderer.render(scene, camera);
    };
    animate();
};

export default displacementSlider;