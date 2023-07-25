const MONITOR_WIDTH = 280;
const MONITOR_HEIGHT = 210;
const CANVAS_WIDTH = 280;
const CANVAS_HEIGHT = 210;
const VIEWPORT_WIDTH = 4;
const VIEWPORT_HEIGHT = 3;
const VIEWPORT_D = 3;
const BACKGROUND_COLOR = [0, 0, 0];
const demoScene = {
    spheres: [
        {
            radius: 4,
            center: [0, -4, 14],
            color: [213, 0, 0],
            specular: 80
        },
        {
            radius: 4,
            center: [8, 0, 16],
            color: [213, 0, 249],
            specular: 80
        },
        {
            radius: 4,
            center: [-8, 0, 16],
            color: [255, 255, 0],
            specular: 80
        },
        {
            radius: 4,
            center: [0, 5, 20],
            color: [0, 200, 83],
            specular: 80
        }
    ],
    lights: [
        {
            type: 'ambient',
            position: null,
            direction: null,
            intensity: 0.2
        },
        {
            type: 'point',
            position: [8, 4, 0],
            direction: null,
            intensity: 0.7
        },
        {
            type: 'directional',
            position: null,
            direction: [4, 16, 16],
            intensity: 0.4
        }
    ]
};

let spheres = [];
let lights = [];


$(document).ready(function () {
    /* Monitor setup */
    makeMonitor(MONITOR_WIDTH, MONITOR_HEIGHT);
    const monitor = $('#preview_grid .pixel');

    /* Registering listeners for live updates */
    $('#input_code').on('change keyup', function (e) {
        // Try to parse input text
        let userScene = null;
        try {
            $('#preview_message').text('Loading scene...');
            userScene = JSON.parse(e.target.value);
            // Validate object here
            // If invalid, set null and throw error
            // For now, handling parse error only.
            if (userScene != null) {
                spheres = userScene.spheres;
                lights = userScene.lights;
            }
            // Load new scene and render
            renderScene();
            $('#preview_message').text('Scene loaded.');
        } catch (error) {
            // Show error message
            // Clear scene, render and return
            spheres = [];
            lights = [];
            renderScene();
            $('#preview_message').text('Scene description not properly formatted!');
        }
    });
    $('#btn_reset').click(function () {
        resetScene();
    })

    /* Fresh start */
    resetScene();

    function makeMonitor(w, h) {
        let grids = "";
        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                grids += "<div class=\"pixel\"></div>";
            }
        }
        $('#preview_grid').html(grids);
    }

    function resetScene() {
        const options = { indent_size: 2, space_in_empty_paren: true };
        const formatted = js_beautify(JSON.stringify(demoScene), options);

        /* Populating pre-defined inputs (demo) */
        $('#input_code').val(formatted);

        /* Force event */
        $('#input_code').change();
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function add(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    }

    function subtract(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function scalerMultiply(a, s) {
        return [a[0] * s, a[1] * s, a[2] * s];
    }

    function scalerDivide(a, s) {
        return [a[0] / s, a[1] / s, a[2] / s];
    }

    function magnitude(a) {
        return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const h = x.toString(16);
            return h.length == 1 ? '0' + h : h;
        }).join('');
    }

    function setPixel(x, y, color) {
        const mx = Math.floor(x + 0.5);
        const my = Math.floor(y + 0.5);
        if (mx < 0 || mx >= MONITOR_WIDTH || my < 0 || my >= MONITOR_HEIGHT) {
            return;
        }
        const n = mx + MONITOR_WIDTH * my;

        //monitor[n].style.backgroundColor = rgbToHex(color[0], color[1], color[2]);
        monitor.eq(n).css('background-color', rgbToHex(color[0], color[1], color[2]));
    }

    function drawLine(x0, y0, x1, y1, color) {
        if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) {
            // Horizontal-ish, make sure x0 < x1
            if (x0 > x1) {
                [x0, x1] = [x1, x0];
                [y0, y1] = [y1, y0];
            }
            const ys = interpolateBresenham(x0, y0, x1, y1);
            for (let x = x0; x <= x1; x++) {
                setPixel(x, ys[x - x0], color);
            }
        } else {
            // Vertical-ish, make sure y0 < y1
            if (y0 > y1) {
                [x0, x1] = [x1, x0];
                [y0, y1] = [y1, y0];
            }
            const xs = interpolateBresenham(y0, x0, y1, x1);
            for (let y = y0; y <= y1; y++) {
                setPixel(xs[y - y0], y, color);
            }
        }
    }

    function interpolateBresenham(x0, y0, x1, y1) {
        if (x0 == x1) {
            return [y0];
        }
        const dx = x1 - x0;
        const dy = y1 - y0;
        let x = x0;
        let y = y0;
        let d_s = 2 * dy;
        let d_t = 2 * (dy - dx);
        let d = 2 * dy - dx;
        let inc = 1;
        if (y0 > y1) {
            d_s = 2 * (dy + dx);
            d_t = 2 * dy;
            d = 2 * dy + dx;
            inc = 0;
        }
        let values = Array(dx);
        values[0] = y;
        while (x < x1) {
            x++;
            if (d < 0) {
                y = y + inc - 1;
                d = d + d_s;
            } else {
                y = y + inc;
                d = d + d_t;
            }
            values[x - x0] = y;
        }
        return values;
    }

    function interpolate(i0, d0, i1, d1) {
        if (i0 == i1) {
            return [d0];
        }
        let values = Array(i1 - i0);
        let a = (d1 - d0) / (i1 - i0);
        let d = d0;
        for (let i = i0; i <= i1; i++) {
            values[i - i0] = d;
            d = d + a;
        }
        return values;
    }

    function computeLighting(p, n, v, s) {
        let intensity = 0.0;
        for (let i = 0; i < lights.length; i++) {
            const light = lights[i];
            if (light.type == 'ambient') {
                intensity += light.intensity;
            } else {
                let l;  // Light vector
                if (light.type == 'point') {
                    l = subtract(light.position, p);
                } else {
                    l = light.direction;
                }
                // Diffuse
                const nDotL = dot(n, l);
                if (nDotL > 0) {
                    intensity += light.intensity * nDotL / (magnitude(n) * magnitude(l));
                }
                // Specular
                if (s != -1) {
                    let r = subtract(scalerMultiply(n, 2 * nDotL), l);
                    let rDotV = dot(r, v);
                    if (rDotV > 0) {
                        intensity += light.intensity * Math.pow(rDotV / (magnitude(r) * magnitude(v)), s);
                    }
                }
            }
        }
        return intensity;
    }


    function intersectRaySphere(o, d, sphere) {
        const r = sphere.radius;
        const co = subtract(o, sphere.center);
        const a = dot(d, d);
        const b = 2 * dot(co, d);
        const c = dot(co, co) - r * r;
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            return [Infinity, Infinity];
        }
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return [t1, t2];
    }

    function traceRay(o, d, tMin, tMax) {
        let closestT = Infinity;
        let closestSphere = null;
        let t1, t2;
        for (let i = 0; i < spheres.length; i++) {
            const sphere = spheres[i];
            [t1, t2] = intersectRaySphere(o, d, sphere);
            if (tMin < t1 && t1 < tMax && t1 < closestT) {
                closestT = t1;
                closestSphere = sphere;
            }
            if (tMin < t2 && t2 < tMax && t2 < closestT) {
                closestT = t2;
                closestSphere = sphere;
            }
        }
        if (closestSphere == null) {
            return BACKGROUND_COLOR;
        }
        let p = add(o, scalerMultiply(d, closestT));    // Intersection
        let cp = subtract(p, closestSphere.center);     // Along sphere normal at intersection point
        let n = scalerDivide(cp, magnitude(cp));         // Normal vector
        let lightMultiplier = computeLighting(p, n, scalerMultiply(d, -1), closestSphere.specular);
        let color = scalerMultiply(closestSphere.color, lightMultiplier);
        color[0] = Math.min(Math.round(color[0]), 255);
        color[1] = Math.min(Math.round(color[1]), 255);
        color[2] = Math.min(Math.round(color[2]), 255);
        return color;
    }

    function canvasToViewport(x, y) {
        return [x * VIEWPORT_WIDTH / CANVAS_WIDTH, y * VIEWPORT_HEIGHT / CANVAS_HEIGHT, VIEWPORT_D];
    }

    function canvasToMonitor(x, y) {
        return [MONITOR_WIDTH / 2 + x, MONITOR_HEIGHT / 2 - y];
    }

    function renderScene() {
        const o = [0, 0, 0];    // Camera position
        let mx, my, d;
        for (let x = -CANVAS_WIDTH / 2; x <= CANVAS_WIDTH / 2; x++) {
            for (let y = -CANVAS_HEIGHT / 2; y <= CANVAS_HEIGHT / 2; y++) {
                d = canvasToViewport(x, y);
                let color = traceRay(o, d, d[2], Infinity);
                [mx, my] = canvasToMonitor(x, y);
                setPixel(mx, my, color);
            }
        }
    }
});
