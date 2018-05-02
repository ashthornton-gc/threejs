//import loader from './projects/loader';
// import depthOfField from './projects/depth-of-field';
// import project3 from './projects/project3';
//import project4 from './projects/project4';
//import project5 from './projects/project5';
// import sphereToggle from './projects/sphereToggle';
import displacementSlider from './projects/displacementSlider';
const imagesLoaded = require('imagesloaded');

//loader();
// depthOfField();
// project3();
//project4();
//project5();
// sphereToggle();

imagesLoaded( document.querySelectorAll('img'), () => {

    document.body.classList.remove('loading');

    const el = document.getElementById('slider');
    const imgs = Array.from(el.querySelectorAll('img'));
    new displacementSlider({
        parent: el,
        images: imgs
    });
    //imgs.forEach( (img) => {
    //    img.style.display = 'none';
    //});

});
