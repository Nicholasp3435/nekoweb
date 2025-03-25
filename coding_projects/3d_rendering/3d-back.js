console.log('Loaded', document.currentScript.src);

/** 
 * haii! if you want to use this code, sorry it's a mess.
 * Anyone can probably do better lol, but if you do want 
 * to use it, credit me!
 * 
 * but um...just use three.js if you actually want to render things
 */




let entities = [];



const model = {
    θx: 0,
    θy: 0,
    θz: 0,

    tx: 0,
    ty: 0,
    tz: 0,

    s: 1,

    vectors: [],
    trans_vectors: [],

    faces: [],
    z_sorted_faces: []
};

const file_input = document.getElementById("obj-input");
file_input.addEventListener("change", handleFiles, false);

const view_btns = document.querySelectorAll('input[name="view"]');
let view = document.querySelector('input[name="view"]:checked').value;
view_btns.forEach(btn => {
    btn.addEventListener('change', (event) => {
        view = document.querySelector('input[name="view"]:checked').value
    })
})


const canvas = document.querySelector('#render');
const ctx = canvas.getContext("2d");

ctx.translate(canvas.width * 0.5,canvas.height * 0.5);


let trans_matr = glMatrix.mat4.create();

let rotation_quat = glMatrix.quat.create();
let transl_vec = glMatrix.vec3.create();
let scale_vec = glMatrix.vec3.create();
let origin_vec = glMatrix.vec3.create();

let camera_vec = glMatrix.vec3.fromValues(0, 0, 1);

let light_vec;

function set_light_vec(x, y, z) {
    light_vec = glMatrix.vec4.fromValues(x,y,z,1);
}

set_light_vec(1, 1, 0);

let pers_matr = glMatrix.mat4.create();
glMatrix.mat4.perspective(pers_matr, .01, 1, 1, Infinity);

ctx.strokeStyle = '#fff4';
ctx.fillStyle = '#84a'

const reader = new FileReader();
function handleFiles() {

    if (!this.files) {
        return;
    } 

    let selected_file = this.files[0]; 



    reader.onload = function(e) {
        let text = e.target.result;

        let coords = [];
        let faces = [];
        let norms = [];

        let lines = text.split(/[\r\n]+/g); 

        lines.forEach(line => {
            line = line.replace(/\s+/g,' ').split(' ');
            if (line[0] === 'v') {
                coords.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
            } else if (line[0] === 'f') {
                faces.push([line[1], line[2], line[3]]);
            } else if (line[0] === 'vn') {
                norms.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
            }
        });

        poplate(model, coords, faces, norms);

        model.tz = glMatrix.vec4.length(model.furthest) * 1.5;
        model.tx = -1* model.center[0];
        model.ty = -1* model.center[1];

        set_light_vec(Math.abs(model.center[0] * glMatrix.vec3.length(model.furthest) * 1.5), Math.abs(model.center[0] * glMatrix.vec3.length(model.furthest) * 1.5), 0);

    };

    reader.readAsText(selected_file,"UTF-8");
}



model.draw = function() {


    glMatrix.quat.fromEuler(rotation_quat, model.θx, model.θy, model.θz);
    transl_vec = glMatrix.vec3.fromValues(model.tx, model.ty, model.tz);
    scale_vec = glMatrix.vec3.fromValues(model.s, model.s, model.s);

    glMatrix.mat4.fromRotationTranslationScaleOrigin(
        trans_matr, rotation_quat, transl_vec, scale_vec, model.center
    );


    model.trans_vectors = model.vectors.map(vector => {

        let trans = transform(vector);

        trans = perspective(trans);
    
        return trans;
    });

    if (view !== "wireframe") {
        model.z_sorted_faces = model.faces.map(face => {

            let trans = transform(face.center);
            trans = perspective(trans);

            if (view === 'shaded') {

                let norm = transform(face.normal);
                norm = perspective(norm);
                return {vectors: face.vectors, center: trans, normal: norm};
            }


            return {vectors: face.vectors, center: trans};
        });
    
        model.z_sorted_faces.sort(compare);
    } 

    ctx.clearRect(canvas.width * -0.5, canvas.height * -0.5, canvas.width, canvas.height);


    model.z_sorted_faces.forEach(face => {
            ctx.beginPath(); 
            ctx.moveTo(model.trans_vectors[face.vectors[0]][0], model.trans_vectors[face.vectors[0]][1]);
            ctx.lineTo(model.trans_vectors[face.vectors[1]][0], model.trans_vectors[face.vectors[1]][1]);
            ctx.lineTo(model.trans_vectors[face.vectors[2]][0], model.trans_vectors[face.vectors[2]][1]);
            ctx.lineTo(model.trans_vectors[face.vectors[0]][0], model.trans_vectors[face.vectors[0]][1]);

            if (view === 'shaded') {
                let norm = glMatrix.vec3.clone(face.normal);
                let ligh = glMatrix.vec3.clone(light_vec);
                glMatrix.vec3.normalize(norm, norm);
                glMatrix.vec3.normalize(ligh, ligh);
                if (glMatrix.vec3.dot(norm, ligh) > 0) {
                    ctx.fillStyle = `hsl(300, 90%, ${glMatrix.vec3.dot(norm, ligh) * 80}%)`;
                } else {
                    ctx.fillStyle = 'black';
                }
                ctx.fill();
            } else {
                ctx.fillStyle = '#b0b';
                ctx.strokeStyle = '#fff4';
                view !== "wireframe" ? ctx.fill() : null;
                ctx.stroke();
            }


    });

    model.θy += .5;
    
    requestAnimationFrame(model.draw);
}

function compare(a, b) {
    if (a.center[3] > b.center[3]) {
        return 1;
    }
    
    if (a.center[3] < b.center[3]) {
        return -1;
    }
    
     return 0;
}

function transform(vector) {
    let trans = glMatrix.vec4.clone(vector);
    glMatrix.vec4.transformMat4(trans, trans, trans_matr);
    

    return trans;
}

function perspective(trans) {
    glMatrix.vec4.transformMat4(trans, trans, pers_matr);
    
    trans = glMatrix.vec4.fromValues(
        trans[0] / trans[3],
        trans[1] / trans[3],
        trans[2] / trans[3],
        trans[3]
    );

    return trans;
    
}


function find_center(model) {
    let center = glMatrix.vec3.create();

    model.faces.forEach(face => {
        glMatrix.vec3.add(center, center, face.center);
    });

    glMatrix.vec3.scale(center, center, 1 / model.faces.length);

    model.center = center;
}

function find_furthest(model) {
    const center = model.center;
    let furthest = glMatrix.vec3.create();

    model.faces.forEach(face => {
        if (glMatrix.vec3.distance(face.center, center) >= glMatrix.vec3.distance(furthest, center)) {
            furthest = face.center;
        }
    });

    model.furthest = furthest;
}


function poplate(model, coords, faces, norms) {
    model.vectors = coords.map(coord => {
        return [
            coord[0],
            coord[1],
            coord[2],
            1
        ];
    });
    
    model.faces = faces.map(face => {

        let norm;
        if (norms.length != 0) {
            norm = norms[parseInt(face[0].split('/')[2] - 1)];
        } else {
            norm = [0,0,0];
        }
        
        ret_face = {
            vectors: [
                parseInt(face[0].split('/')[0] - 1),
                parseInt(face[1].split('/')[0] - 1),
                parseInt(face[2].split('/')[0] - 1),
            ],
            normal: glMatrix.vec4.fromValues(
                norm[0],
                norm[1],
                norm[2],
                1
            ),
            center: [ glMatrix.vec4.create() ]
        }



        glMatrix.vec4.add(ret_face.center, model.vectors[ret_face.vectors[0]], model.vectors[ret_face.vectors[1]]);
        glMatrix.vec4.add(ret_face.center, ret_face.center, model.vectors[ret_face.vectors[2]]);
        glMatrix.vec4.scale(ret_face.center, ret_face.center, 1/3);


        return ret_face;

    });

    model.z_sorted_faces = model.faces.map(e => e);

    find_center(model);
    find_furthest(model);
}

let default_file;

function draw_default() {
    fetch("eevee.obj")
    .then((res) => res.text())
    .then((text) => {
        let coords = [];
        let faces = [];
        let norms = [];

        let lines = text.split(/[\r\n]+/g); 

        lines.forEach(line => {
            line = line.replace(/\s+/g,' ').split(' ');
            if (line[0] === 'v') {
                coords.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
            } else if (line[0] === 'f') {
                faces.push([line[1], line[2], line[3]]);
            } else if (line[0] === 'vn') {
                norms.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
            }
        });

        poplate(model, coords, faces, norms);

        model.tz = glMatrix.vec3.length(model.furthest) * 1.5;
        model.tx = -1* model.center[0];
        model.ty = -1* model.center[1];

        set_light_vec(Math.abs(model.center[0] * glMatrix.vec3.length(model.furthest) * 1.5), Math.abs(model.center[0] * glMatrix.vec3.length(model.furthest) * 1.5), 0);

        model.draw();

     })
    .catch((e) => console.error(e));
}


draw_default();