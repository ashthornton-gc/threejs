import * as THREE from 'three';
import Stats from 'stats.js';
import dat from 'dat.gui';
import F2D from './project5/f2d';
let SPECTOR = require('spectorjs');

const project5 = function() {

    let renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    let windowSize = new THREE.Vector2(renderWidth, renderHeight);

    let renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.autoClear = true;
    renderer.sortObjects = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowSize.x, windowSize.y);
    renderer.setClearColor(0xFFFFFF, 1);
    document.body.appendChild(renderer.domElement);

    let stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";
    document.body.appendChild(stats.domElement);

    let grid = {
        size: new THREE.Vector2(512, 256),
        scale: 1,
        applyBoundaries: true
    };
    let time = {
        step: 0.05,
    };
    let displayScalar;
    let solver, gui;
    let mouse = new F2D.Mouse(grid);

    function init(shaders) {

        solver = F2D.Solver.make(grid, time, windowSize, shaders);

        displayScalar = new F2D.Display(shaders.basic, shaders.displayscalar);

        gui = new dat.GUI();

        gui.add(time, "step").min(0).step(0.01);

        let viscosityFolder = gui.addFolder("Viscosity");
        viscosityFolder.add(solver, "applyViscosity");
        viscosityFolder.add(solver, "viscosity").min(0).step(0.01);

        // let poissonPressureEqFolder = gui.addFolder("Poisson Pressure Equation");
        // poissonPressureEqFolder.add(solver.poissonPressureEq, "iterations", 0, 500, 1);

        // we need a splat color "adapter" since we want values between 0 and
        // 1 but also since dat.GUI requires a JavaScript array over a Three.js
        // vector
        let splatSettings = {
            color: [
                solver.ink.x * 255,
                solver.ink.y * 255,
                solver.ink.z * 255
            ]
        };
        let splatSettings2 = {
            color: [
                solver.ink2.x * 255,
                solver.ink2.y * 255,
                solver.ink2.z * 255
            ]
        };
        let splatFolder = gui.addFolder("Splat");
        splatFolder.add(solver.splat, "radius").min(0);
        splatFolder.addColor(splatSettings, "color").onChange(function(value) {
            solver.ink.set(value[0] / 255, value[1] / 255, value[2] / 255);
        });

        let splatFolder2 = gui.addFolder("Splat2");
        splatFolder2.add(solver.splat2, "radius").min(0);
        splatFolder2.addColor(splatSettings2, "color").onChange(function(value) {
            solver.ink2.set(value[0] / 255, value[1] / 255, value[2] / 255);
        });

        let gridFolder = gui.addFolder("Grid");
        gridFolder.add(grid, "applyBoundaries");
        gridFolder.add(grid, "scale");

        window.addEventListener('resize', onWindowResize, false);

        animate();

        let spector = new SPECTOR.Spector();
        spector.displayUI();
    }

    var point = new THREE.Vector2();
    var force = new THREE.Vector3();
    function initSplat(renderer, mouse) {
        for (var i = 0; i < mouse.motions.length; i++) {
            var motion = mouse.motions[i];

            point.set(motion.position.x, this.windowSize.y - motion.position.y);
            // normalize to [0, 1] and scale to grid size
            point.x = (point.x / this.windowSize.x) * this.grid.size.x;
            point.y = (point.y / this.windowSize.y) * this.grid.size.y;

            if (motion.right) {
                this.splat.compute(
                    renderer,
                    this.density,
                    this.source,
                    point,
                    this.density
                );
            }
        }
        mouse.motions = [];
    };

    function onWindowResize() {
        renderWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        renderHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        windowSize.set(renderWidth, renderHeight);
        renderer.setSize(windowSize.x, windowSize.y);
    }

    function animate() {

        stats.begin();

        solver.step(renderer, mouse);
        render();

        stats.end();
        requestAnimationFrame(animate);
    }

    function render() {

        let display, read;

        display = displayScalar;
        display.scale.copy(solver.ink);
        display.scale2.copy(solver.ink2);
        display.bias.set(0, 0, 0);
        read = solver.density.read;

        display.render(renderer, read);

    }

    let loader = new F2D.FileLoader("/projects/project5/shaders/", [
        "advect.fs",
        "basic.vs",
        "gradient.fs",
        "jacobiscalar.fs",
        "jacobivector.fs",
        "displayscalar.fs",
        // "displayvector.fs",
        "divergence.fs",
        "splat.fs",
        // "vorticity.fs",
        // "vorticityforce.fs",
        "boundary.fs"
    ]);
    loader.run(function(files) {
        // remove file extension before passing shaders to init
        let shaders = {};
        for (let name in files) {
            shaders[name.split(".")[0]] = files[name];
        }
        init(shaders);
    });

};

export default project5;