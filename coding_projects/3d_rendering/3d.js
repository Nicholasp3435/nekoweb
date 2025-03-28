const { vec3, vec4, mat4, quat } = glMatrix;

class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.translate(canvas.width * 0.5,canvas.height * 0.5);

        this.models = [];

        this.frame = 0;

        this.lightVec = vec3.fromValues(1, 0, 0);

        this.isMouseDragging = false;

        this.canvas.addEventListener('mousedown', () => this.isMouseDragging = true);
        this.canvas.addEventListener('mouseup', () => this.isMouseDragging = false);
    
        this.canvas.addEventListener('mousemove', e => {
            if (!this.isMouseDragging) {
                return;
            }
            console.log(e)
        });
    }

    addModel(model) {
        this.models.push(model);
    }

    removeModel(name) {
        this.models = this.models.filter(model => model.name != name);
    }

    setLight(x, y, z) {
        this.lightVec = vec3.fromValues(x, y, z);
        vec3.normalize(this.lightVec, this.lightVec);
    }

    draw() {

        this.models.sort(z_model_compare);

        this.ctx.clearRect(
            this.canvas.width * -0.5,
            this.canvas.height * -0.5,
            this.canvas.width,
            this.canvas.height
        );

        this.models.forEach(model => {
            model.draw(this);
        });

        this.frame++;
    }
}

class Model {
    constructor(name, [vectors, faces]) {
        this.name = name;

        this.vectors = vectors;
        this.faces = faces;

        this.transformedVectors;
        this.transformedFaces = faces;
        
        this.scaleVec = vec3.fromValues(1, 1, 1);

        this.center = vec3.create();
        this.vectors.forEach(vector => {
            vec3.add(this.center, this.center, vector);
        });
        vec3.scale(this.center, this.center, 1 / this.vectors.length);

        this.furthest = vec3.create();
    
        this.vectors.forEach(vector => {
            if (vec3.distance(vector, this.center) >= vec3.distance(this.furthest, this.center)) {
                vec3.copy(this.furthest, vector);
            }
        });

        this.rotation = {
            x: 0,
            y: 0,
            z: 0
        }

        this.rotationQuat = quat.fromValues(
            this.rotation.x,
            this.rotation.y,
            this.rotation.z,
            1
        );

        this.translation = {
            x: -this.center[0],
            y: -this.center[1],
            z: vec3.length(this.furthest) * 1.5
        }

        this.translationVec = vec3.fromValues(
            this.translation.x,
            this.translation.y,
            this.translation.z
        );

        this.scale = 1;

        this.transformationMat = mat4.create();
        mat4.fromRotationTranslationScaleOrigin(
            this.transformationMat,
            this.rotationQuat,
            this.translationVec,
            this.scaleVec,
            this.center
        );

        this.perspectiveMat = mat4.create();
        this.perspectiveMat = mat4.perspective(
            this.perspectiveMat,
            .01,
            1,
            1,
            Infinity
        );

        this.strokeStyle = '#fff';
        this.fillStyle = '#f0f';

        this.drawMode = 'wireframe';
    }

    setRotation(x, y, z) {
        quat.fromEuler(this.rotationQuat, x, y, z);
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
    }

    addRotation(x, y, z) {
        this.setRotation(
            this.rotation.x + x,
            this.rotation.y + y,
            this.rotation.z + z
        );
    }

    setTranslation(x, y, z) {
        this.translationVec = vec3.fromValues(x, y, z);
        this.translation.x = x;
        this.translation.y = y;
        this.translation.z = z;
    }

    addTranslation(x, y, z) {
        this.setTranslation(
            this.translation.x + x,
            this.translation.y + y,
            this.translation.z + z
        );
    }

    setScale(s) {
        this.translationVec = vec3.fromValues(s, s, s);
        this.scale = s;
    }

    setTransformation() {
        mat4.fromRotationTranslationScaleOrigin(
            this.transformationMat,
            this.rotationQuat,
            this.translationVec,
            this.scaleVec,
            this.center
        );
    }

    transformVector(vector) {
        let transformedVector = vec4.clone(vector);
        vec4.transformMat4(transformedVector, transformedVector, this.transformationMat);
        return transformedVector;
    }

    perspectiveDivide(vector) {
        vec4.transformMat4(vector, vector, this.perspectiveMat);
        
        let pers = vec4.fromValues(
            vector[0] / vector[3],
            vector[1] / vector[3],
            vector[2] / vector[3],
            1
        );
    
        return pers;
    }

    transformVectors() {
        this.transformedVectors = this.vectors.map(vector => {
            return this.transformVector(vector);
        });
    }

    perspectiveDivideVectors() {
        this.transformedVectors = this.transformedVectors.map(vector => {
            return this.perspectiveDivide(vector);
        });
    }

    zSortFaces() {
        let normalMat = mat4.create();
        mat4.invert(normalMat, this.transformationMat);
        mat4.transpose(normalMat, normalMat);
    
        this.transformedFaces = this.faces.map(face => {
            let transCenter = this.transformVector(face.center);
            transCenter = this.perspectiveDivide(transCenter);
    
            let transNormal = vec4.create();
            vec4.transformMat4(transNormal, face.normal, normalMat);
            vec4.normalize(transNormal, transNormal);
    
            return {
                vectors: face.vectors,
                center: transCenter,
                normal: transNormal
            };
        });
    
        this.transformedFaces.sort(z_face_compare);
    }

    drawWireframe(scene) {
        scene.ctx.stroke();
    }

    drawSolid(scene) {
        scene.ctx.stroke();
        scene.ctx.fill();
    }

    drawShaded(scene, normal) {
        let norm3 = vec3.fromValues(
            normal[0],
            normal[1],
            normal[2]
        );

        vec3.normalize(norm3, norm3);

        let lightness = vec3.dot(norm3, scene.lightVec) * 100;

        scene.ctx.fillStyle = `hsl(300, 100%, ${lightness}%)`;
        scene.ctx.strokeStyle = `hsl(300, 100%, ${lightness}%)`;

        if (vec3.dot(norm3, vec3.fromValues(0, 0, 1)) < 0) {
            scene.ctx.stroke();
            scene.ctx.fill();   
        }
    }

    flipNormals() {
        this.faces.forEach(face => {
            face.normal = vec4.fromValues(
                -face.normal[0],
                -face.normal[1],
                -face.normal[2],
                -1
            )
        })
    }
    

    draw(scene) {
        scene.ctx.strokeStyle = this.strokeStyle;
        scene.ctx.fillStyle = this.fillStyle;

        this.setTransformation();

        this.transformVectors();
        this.perspectiveDivideVectors();

        this.drawMode != 'wireframe' ? this.zSortFaces() : null ;

        this.transformedFaces.forEach(face => {


            scene.ctx.beginPath(); 
            scene.ctx.moveTo(this.transformedVectors[face.vectors[0]][0], this.transformedVectors[face.vectors[0]][1]);
            scene.ctx.lineTo(this.transformedVectors[face.vectors[1]][0], this.transformedVectors[face.vectors[1]][1]);
            scene.ctx.lineTo(this.transformedVectors[face.vectors[2]][0], this.transformedVectors[face.vectors[2]][1]);
            scene.ctx.lineTo(this.transformedVectors[face.vectors[0]][0], this.transformedVectors[face.vectors[0]][1]);
            
            switch (this.drawMode) {
                case 'wireframe':
                    this.drawWireframe(scene);
                    break;
                case 'solid':
                    this.drawSolid(scene)
                    break;
                case 'shaded':
                    this.drawShaded(scene, face.normal);
                    break;
            }
        });
    }
}

function z_face_compare(face1, face2) {
    if (face1.center[2] > face2.center[2]) {
        return 1;
    } 
    if (face1.center[2] < face2.center[2]) {
        return -1;
    }
    return 0;
}

function z_model_compare(model1, model2) {
    if (model1.translation.z > model2.translation.z) {
        return -1;
    } 
    if (model1.translation.z < model2.translation.z) {
        return 1;
    }
    return 0;
}

function read_obj(text) {
    if (!text) {
        console.error("text is null:");
    }

    
    const lines = text.split(/[\r\n]+/g); 

    let vertices = [];
    let faces = [];
    let normals = [];

    lines.forEach(line => {
        line = line.replace(/\s+/g,' ').split(' ');

        if (line[0] === 'v') {
            // parses as floats
            vertices.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
        } else if (line[0] === 'f') {
            // retains all the texture and normal data
            faces.push([line[1], line[2], line[3]]);
        } else if (line[0] === 'vn') {
            // parses as floats
            normals.push([parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])]);
        }
    });

    return [vertices, faces, normals];
}

function parse_vertices_faces([vertices, faces, normals]) {

    let parsed_vertices = vertices.map(vertex => {
        return vec4.fromValues(
            vertex[0],
            vertex[1],
            vertex[2],
            1
        );
    });

    let parsed_faces = faces.map(face => {
        let normal;

        if (normals.length != 0) {
            // gets the normal from the face
            normal = normals[parseInt(face[0].split('/')[2] - 1)];
        } else {
            normal = [0,0,0];
        }

        // but my way of getting normals makes it look better
        normal = [0,0,0];
        
        let parsed_face = {
            vectors: [
                parseInt(face[0].split('/')[0] - 1),
                parseInt(face[1].split('/')[0] - 1),
                parseInt(face[2].split('/')[0] - 1),
            ],
            normal: vec4.fromValues(
                normal[0],
                normal[1],
                normal[2],
                1
            ),
            center: vec4.fromValues(0, 0, 0, 1)
        }

        if (vec4.exactEquals(parsed_face.normal, vec4.fromValues(0, 0, 0, 1))) {
            let ab = vec3.create();
            vec3.subtract(ab, parsed_vertices[parsed_face.vectors[1]], parsed_vertices[parsed_face.vectors[0]]);
            let ac = vec3.create();
            vec3.subtract(ac, parsed_vertices[parsed_face.vectors[2]], parsed_vertices[parsed_face.vectors[0]]);

            let normal = vec3.create();
            vec3.cross(normal, ab, ac);

            parsed_face.normal = vec4.fromValues(
                normal[0],
                normal[1],
                normal[2],
                1
            )
        }

        vec4.add(
            parsed_face.center, 
            parsed_vertices[parsed_face.vectors[0]],
            parsed_vertices[parsed_face.vectors[1]]
        );
        vec4.scaleAndAdd(
            parsed_face.center,
            parsed_face.center,
            parsed_vertices[parsed_face.vectors[2]],
            1/3
        );

        return parsed_face;
    });

    return [parsed_vertices, parsed_faces];
}

function fetch_data(url) {
    return fetch(url).then( response => {
        if (!response.ok) {
            throw new Error("Error in fetching URL: " + file_url + ". " + response.statusText);
        }
        return response.text();
    })
    .catch( error => error );
}

async function get_model_from_url(name, url) {
    return new Model(name, parse_vertices_faces(read_obj(await fetch_data(url))));
}

function get_model_from_input() {
    const reader = new FileReader();

    reader.onload = function(e) {
        let model =  new Model("input", parse_vertices_faces(read_obj(e.target.result)));

        mainScene.models.forEach(model => {
            mainScene.removeModel(model.name);
        })
        mainScene.addModel(model);
        model.drawMode = 'shaded'
    }

    reader.readAsText(this.files[0],"UTF-8");

}

const mainScene = new Scene(document.querySelector('canvas'));
const file_input = document.getElementById("obj-input");
const view_btns = document.querySelectorAll('input[name="view"]');

let view = document.querySelector('input[name="view"]:checked').value;
view_btns.forEach(btn => {
    btn.addEventListener('change', (event) => {
        view = document.querySelector('input[name="view"]:checked').value
    })
})

file_input.addEventListener("change", get_model_from_input);

async function init_scene() {
    let eevee = await get_model_from_url('eevee', 'eevee.obj');
    eevee.drawMode = 'shaded'

    mainScene.addModel(eevee);
    eevee.setRotation(0, 180, 0);

    mainScene.setLight(1, 0, -1);

    drawLoop();
}

function drawLoop() {
    mainScene.draw();

    mainScene.models.forEach(model => {
        model.addRotation(0, .33, 0);
        model.drawMode = view;
        
    })

    requestAnimationFrame(drawLoop);
}

init_scene();