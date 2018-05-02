//import loader from './projects/loader';
// import depthOfField from './projects/depth-of-field';
// import project3 from './projects/project3';
//import project4 from './projects/project4';
//import project5 from './projects/project5';
// import sphereToggle from './projects/sphereToggle';
import displacementSlider from './projects/displacementSlider';

//loader();
// depthOfField();
// project3();
//project4();
//project5();
// sphereToggle();

const el = document.getElementById('slider');
const imgs = Array.from(el.querySelectorAll('img'));
new displacementSlider({
    parent: el,
    image1: imgs[0].getAttribute('src'),
    image2: imgs[1].getAttribute('src'),
    image3: imgs[2].getAttribute('src'),
});
