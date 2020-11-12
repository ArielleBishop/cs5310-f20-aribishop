// TODO: Upon deleting the last shape it is still rendered on canvas
// TODO: triangles seemingly don't exist

const origin = { x: 0, y: 0, z: 0 }
const sizeOne = { width: 1, height: 1, depth: 1 }
const RED_HEX = "#FF0000"
const RED_RGB = webglUtils.hexToRgb(RED_HEX)
const GREEN_HEX = "00FF00"
const GREEN_RGB = webglUtils.hexToRgb(GREEN_HEX)
const BLUE_HEX = "#0000FF"
const BLUE_RGB = webglUtils.hexToRgb(BLUE_HEX)
const CYAN_HEX = "#00FFFF"
const CYAN_RGB = webglUtils.hexToRgb(CYAN_HEX)
const YELLOW_HEX = "#FFFF00"
const YELLOW_RGB = webglUtils.hexToRgb(YELLOW_HEX)
const MAGENTA_HEX = "#FF00FF"
const MAGENTA_RGB = webglUtils.hexToRgb(MAGENTA_HEX)
const up = [0, 1, 0]
let target = [5, 0, 10]
let lookAt = true

let camera = {
    translation: {x: 45, y: 35, z: -21},
    rotation: {x: 40, y: 235, z: 0}
}

let lightSource = [0.4, -0.3, 0.2]

const shapeTypes = {
    rectangle: "RECTANGLE",
    triangle: "TRIANGLE",
    ellipse: "ELLIPSE",
    star: "STAR",
    cube: "CUBE"
}

let shapes = [
    {
        type: shapeTypes.cube,
        position: origin,
        dimensions: sizeOne,
        color: BLUE_RGB,
        translation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    {
        type: shapeTypes.cube,
        position: origin,
        dimensions: sizeOne,
        color: GREEN_RGB,
        translation: { x: 20, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    {
        type: shapeTypes.cube,
        position: origin,
        dimensions: sizeOne,
        color: RED_RGB,
        translation: { x: -20, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 }
    }
    // {
    //     type: shapeTypes.rectangle,
    //     position: origin,
    //     dimensions: sizeOne,
    //     color: RED_RGB,
    //     translation: { x: -65, y: 25, z: -120 },
    //     scale: { x: 50, y: 50, z: 10 },
    //     rotation: { x: 0, y: 0, z: 0 }
    // },
    // {
    //     type: shapeTypes.triangle,
    //     position: origin,
    //     dimensions: sizeOne,
    //     color: BLUE_RGB,
    //     translation: { x: -65, y: 25, z: -100 },
    //     scale: { x: 50, y: 50, z: 10 },
    //     rotation: { x: 0, y: 0, z: 0 }
    // },
    // {
    //     type: shapeTypes.ellipse,
    //     position: origin,
    //     dimensions: sizeOne,
    //     color: GREEN_RGB,
    //     translation: { x: 60, y: 25, z: -80 },
    //     scale: { x: 30, y: 30, z: 15 },
    //     rotation: { x: 0, y: 0, z: 0 }
    // },
    // {
    //     type: shapeTypes.star,
    //     position: origin,
    //     dimensions: sizeOne,
    //     color: CYAN_RGB,
    //     translation: { x: 35, y: -15, z: -60 },
    //     scale: { x: 20, y: 20, z: 5 },
    //     rotation: { x: 0, y: 0, z: 36 }
    // }
]

let gl, attributeCoords, uniformMatrix, uniformColor, bufferCoords
let attributeNormals, uniformWorldViewProjection, uniformWorldInverseTranspose, uniformReverseLightDirectionLocation, normalBuffer

const doMouseDown = (event) => {
    const boundingRectangle = canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - boundingRectangle.left - boundingRectangle.width / 2);
    const y = -Math.round(event.clientY - boundingRectangle.top - boundingRectangle.height / 2);
    const translation = { x, y, z: -150 }
    const rotation = { x: 0, y: 0, z: 180 }

    addShape(translation, null, rotation)
}

const init = () => {
    // get a reference to the canvas and WebGL context
    const canvas = document.querySelector("#canvas");

    canvas.addEventListener("mousedown", doMouseDown, false);

    gl = canvas.getContext("webgl");

    // create and use a GLSL program
    const program = webglUtils.createProgramFromScripts(gl, "#vertex-shader-3d", "#fragment-shader-3d");
    gl.useProgram(program);

    // get reference to GLSL attributes and uniforms
    attributeCoords = gl.getAttribLocation(program, "a_coords");
    uniformMatrix = gl.getUniformLocation(program, "u_matrix");
    const uniformResolution = gl.getUniformLocation(program, "u_resolution");
    uniformColor = gl.getUniformLocation(program, "u_color");

    // initialize coordinate attribute to send each vertex to GLSL program
    gl.enableVertexAttribArray(attributeCoords);

    // initialize coordinate buffer to send array of vertices to GPU
    bufferCoords = gl.createBuffer();

    attributeNormals = gl.getAttribLocation(program, "a_normals");
    gl.enableVertexAttribArray(attributeNormals);
    normalBuffer = gl.createBuffer();

    uniformWorldViewProjection = gl.getUniformLocation(program, "u_worldViewProjection");
    uniformWorldInverseTranspose = gl.getUniformLocation(program, "u_worldInverseTranspose");
    uniformReverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");

    // configure canvas resolution and clear the canvas
    gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    document.getElementById("tx").onchange = event => updateTranslation(event, "x")
    document.getElementById("ty").onchange = event => updateTranslation(event, "y")
    document.getElementById("tz").onchange = event => updateTranslation(event, "z")

    document.getElementById("sx").onchange = event => updateScale(event, "x")
    document.getElementById("sy").onchange = event => updateScale(event, "y")
    document.getElementById("sz").onchange = event => updateScale(event, "z")

    document.getElementById("rx").onchange = event => updateRotation(event, "x")
    document.getElementById("ry").onchange = event => updateRotation(event, "y")
    document.getElementById("rz").onchange = event => updateRotation(event, "z")

    document.getElementById("fv").onchange = event => updateFieldOfView(event)

    document.getElementById("color").onchange = event => updateColor(event)

    document.getElementById("lookAt").onchange = event => webglUtils.toggleLookAt(event)
    document.getElementById("ctx").onchange = event => webglUtils.updateCameraTranslation(event, "x")
    document.getElementById("cty").onchange = event => webglUtils.updateCameraTranslation(event, "y")
    document.getElementById("ctz").onchange = event => webglUtils.updateCameraTranslation(event, "z")
    document.getElementById("crx").onchange = event => webglUtils.updateCameraRotation(event, "x")
    document.getElementById("cry").onchange = event => webglUtils.updateCameraRotation(event, "y")
    document.getElementById("crz").onchange = event => webglUtils.updateCameraRotation(event, "z")
    document.getElementById("ltx").onchange = event => webglUtils.updateLookAtTranslation(event, 0)
    document.getElementById("lty").onchange = event => webglUtils.updateLookAtTranslation(event, 1)
    document.getElementById("ltz").onchange = event => webglUtils.updateLookAtTranslation(event, 2)

    document.getElementById("lookAt").checked = lookAt
    document.getElementById("ltx").value = target[0]
    document.getElementById("lty").value = target[1]
    document.getElementById("ltz").value = target[2]
    document.getElementById("ctx").value = camera.translation.x
    document.getElementById("cty").value = camera.translation.y
    document.getElementById("ctz").value = camera.translation.z
    document.getElementById("crx").value = camera.rotation.x
    document.getElementById("cry").value = camera.rotation.y
    document.getElementById("crz").value = camera.rotation.z

    document.getElementById("dlrx").value = lightSource[0]
    document.getElementById("dlry").value = lightSource[1]
    document.getElementById("dlrz").value = lightSource[2]

    document.getElementById("dlrx").onchange = event => webglUtils.updateLightDirection(event, 0)
    document.getElementById("dlry").onchange = event => webglUtils.updateLightDirection(event, 1)
    document.getElementById("dlrz").onchange = event => webglUtils.updateLightDirection(event, 2)

    document.addEventListener('keydown', handleKey);

    selectShape(0)
}

const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(attributeNormals, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 1;
    const zFar = 2000;

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);

    let cameraMatrix = m4.identity();
    let projectionMatrix, viewProjectionMatrix;
    if (lookAt) {
        let cameraMatrix = m4.identity()
        cameraMatrix = m4.translate(
            cameraMatrix,
            camera.translation.x,
            camera.translation.y,
            camera.translation.z)
        const cameraPosition = [
            cameraMatrix[12],
            cameraMatrix[13],
            cameraMatrix[14]]
        cameraMatrix = m4.lookAt(
            cameraPosition,
            target,
            up)
        cameraMatrix = m4.inverse(cameraMatrix)
        projectionMatrix = m4.perspective(
            fieldOfViewRadians, aspect, zNear, zFar)
        viewProjectionMatrix = m4.multiply(
            projectionMatrix, cameraMatrix)
    } else {
        cameraMatrix = m4.zRotate(
            cameraMatrix,
            m4.degToRad(camera.rotation.z));
        cameraMatrix = m4.xRotate(
            cameraMatrix,
            m4.degToRad(camera.rotation.x));
        cameraMatrix = m4.yRotate(
            cameraMatrix,
            m4.degToRad(camera.rotation.y));
        cameraMatrix = m4.translate(
            cameraMatrix,
            camera.translation.x,
            camera.translation.y,
            camera.translation.z);
        projectionMatrix = m4.perspective(
            fieldOfViewRadians, aspect, zNear, zFar);
        viewProjectionMatrix = m4.multiply(
            projectionMatrix, cameraMatrix);
    }

    let worldMatrix = m4.identity()
    const worldViewProjectionMatrix
        = m4.multiply(viewProjectionMatrix, worldMatrix);
    const worldInverseMatrix
        = m4.inverse(worldMatrix);
    const worldInverseTransposeMatrix
        = m4.transpose(worldInverseMatrix);

    gl.uniformMatrix4fv(uniformWorldViewProjection, false,
        worldViewProjectionMatrix);
    gl.uniformMatrix4fv(uniformWorldInverseTranspose, false,
        worldInverseTransposeMatrix);

    gl.uniform3fv(uniformReverseLightDirectionLocation,
        m4.normalize(lightSource));

    const $shapeList = $("#object-list")
    $shapeList.empty()
    shapes.forEach((shape, index) => {
        const $li = $(`
            <li>
            <label>
            <input
                    type="radio"
                    id="${shape.type}-${index}"
                    name="shape-index"
                    ${index === selectedShapeIndex ? "checked" : ""}
                    onclick="selectShape(${index})"
                    value="${index}" />
                ${shape.type};
                X: ${shape.translation.x};
                Y: ${shape.translation.y}
            </label>
            </li>
        `)
        $shapeList.append($li)

        gl.uniform4f(uniformColor, shape.color.red, shape.color.green, shape.color.blue, 1);

        let M = computeModelViewMatrix(shape, worldViewProjectionMatrix)
        gl.uniformMatrix4fv(uniformWorldViewProjection, false, M)

        switch (shape.type) {
            case shapeTypes.rectangle:
                renderRectangle(shape);
                break;
            case shapeTypes.triangle:
                renderTriangle(shape);
                break;
            case shapeTypes.ellipse:
                renderEllipse(shape);
                break;
            case shapeTypes.star:
                renderStar(shape);
                break;
            case shapeTypes.cube:
                renderCube(shape);
                break;
            default:
                console.log(`Unexpected ShapeType encountered: ${shape.type}`)
        }
    })
}

let fieldOfViewRadians = m4.degToRad(60)
const computeModelViewMatrix = (shape, viewProjectionMatrix) => {
    M = m4.translate(viewProjectionMatrix,
        shape.translation.x,
        shape.translation.y,
        shape.translation.z)
    M = m4.xRotate(M, m4.degToRad(shape.rotation.x))
    M = m4.yRotate(M, m4.degToRad(shape.rotation.y))
    M = m4.zRotate(M, m4.degToRad(shape.rotation.z))
    M = m4.scale(M, shape.scale.x, shape.scale.y, shape.scale.z)
    return M
}

const handleKey = (e) => {
    let ctzValue = parseInt(document.getElementById("ctz").value);
    let cryValue = parseInt(document.getElementById("cry").value);
    let targetX = target[0];

    let newValue;
    switch (e.code) {
        // MOVE FORWARD
        case "ArrowUp":
        case "KeyW":
            newValue = lookAt ? ctzValue - 5 : ctzValue + 5
            document.getElementById("ctz").value = newValue
            camera.translation["z"] = newValue
            render()
            break;
        // TURN LEFT
        case "ArrowLeft":
        case "KeyA":
            if (lookAt) {
                newValue = targetX - 2
                document.getElementById("ltx").value = newValue
                target[0] = newValue
            } else {
                newValue = cryValue - 2
                document.getElementById("cry").value = newValue
                camera.rotation["y"] = newValue
            }
            render()
            break;
        // MOVE BACKWARD
        case "ArrowDown":
        case "KeyS":
            newValue = lookAt ? ctzValue + 5 : ctzValue - 5
            document.getElementById("ctz").value = newValue
            camera.translation["z"] = newValue
            render()
            break;
        // TURN RIGHT
        case "ArrowRight":
        case "KeyD":
            if (lookAt) {
                newValue = targetX + 2
                document.getElementById("ltx").value = newValue
                target[0] = newValue
            } else {
                newValue = cryValue + 2
                document.getElementById("cry").value = newValue
                camera.rotation["y"] = newValue
            }
            render()
            break;
    }
}

let selectedShapeIndex = 0

const selectShape = (selectedIndex) => {
    selectedShapeIndex = selectedIndex
    document.getElementById("tx").value = shapes[selectedIndex].translation.x
    document.getElementById("ty").value = shapes[selectedIndex].translation.y
    document.getElementById("tz").value = shapes[selectedIndex].translation.z
    document.getElementById("sx").value = shapes[selectedIndex].scale.x
    document.getElementById("sy").value = shapes[selectedIndex].scale.y
    document.getElementById("sz").value = shapes[selectedIndex].scale.z
    document.getElementById("rx").value = shapes[selectedIndex].rotation.x
    document.getElementById("ry").value = shapes[selectedIndex].rotation.y
    document.getElementById("rz").value = shapes[selectedIndex].rotation.z
    const hexColor = webglUtils.rgbToHex(shapes[selectedIndex].color)
    document.getElementById("color").value = hexColor
}

const deleteShape = () => {
    shapes.splice(selectedShapeIndex, 1)

    if (shapes.length == 0) {
        document.getElementById("tx").value = 0
        document.getElementById("ty").value = 0
        document.getElementById("sx").value = 1
        document.getElementById("sy").value = 1
        document.getElementById("rz").value = 0
        document.getElementById("color").value = "#000000"
    }

    selectShape(shapes.length - 1);

    render()
}

const updateTranslation = (event, axis) => {
    shapes[selectedShapeIndex].translation[axis] = event.target.value
    render()
}

const updateScale = (event, axis) => {
    shapes[selectedShapeIndex].scale[axis] = event.target.value
    render()
}

const updateFieldOfView = (event) => {
    fieldOfViewRadians = m4.degToRad(event.target.value);
    render();
}

const updateRotation = (event, axis) => {
    shapes[selectedShapeIndex].rotation[axis] = event.target.value
    render();
}

const updateColor = (event) => {
    const value = event.target.value
    shapes[selectedShapeIndex].color = webglUtils.hexToRgb(value)
    render();
}

const renderRectangle = (rectangle) => {
    const x1 = rectangle.position.x
        - rectangle.dimensions.width / 2;
    const y1 = rectangle.position.y
        - rectangle.dimensions.height / 2;
    const x2 = rectangle.position.x
        + rectangle.dimensions.width / 2;
    const y2 = rectangle.position.y
        + rectangle.dimensions.height / 2;

    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([
            x1, y1, 0, x2, y1, 0, x1, y2, 0,
            x1, y2, 0, x2, y1, 0, x2, y2, 0
        ]), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const renderTriangle = (triangle) => {
    const x1 = triangle.position.x - triangle.dimensions.width / 2
    const y1 = triangle.position.y + triangle.dimensions.height / 2
    const x2 = triangle.position.x + triangle.dimensions.width / 2
    const y2 = triangle.position.y + triangle.dimensions.height / 2
    const x3 = triangle.position.x
    const y3 = triangle.position.y - triangle.dimensions.height / 2

    const float32Array = new Float32Array([
        x1, y1, 0, x2, y2, 0, x3, y3, 0
    ])

    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const renderEllipse = (ellipse) => {
    const divisions = Math.max(4, ellipse.dimensions.width * ellipse.scale.x, ellipse.dimensions.height * ellipse.scale.y);
    let points = [];

    for (let theta = 0; theta < (2 * Math.PI); theta += (2 * Math.PI / divisions)) {
        const point = {
            x: ellipse.position.x + Math.cos(theta) * ellipse.dimensions.width / 2,
            y: ellipse.position.y + Math.sin(theta) * ellipse.dimensions.height / 2
        }

        points.push(point)
    }

    let triangles = [
        points[points.length - 1].x, points[points.length - 1].y, 0,
        points[0].x, points[0].y, 0,
        ellipse.position.x, ellipse.position.y, 0
    ];

    for (let i = 0; i < points.length - 1; i++) {
        triangles.push(
            points[i].x, points[i].y, 0,
            points[i + 1].x, points[i + 1].y, 0,
            ellipse.position.x, ellipse.position.y, 0)
    }

    const float32Array = new Float32Array(triangles)
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW)
    gl.drawArrays(gl.TRIANGLES, 0, points.length * 3)
}

const renderStar = (star) => {
    // I originally wanted this to render an n-sided regular star polygon and eventually got too bogged down in the trigonometry and gave up
    const n = 5;
    let outer = []
    let inner = []

    for (let theta = Math.PI / -2; theta < (1.5 * Math.PI); theta += (2 * Math.PI / n)) {
        outer.push({
            x: star.position.x + Math.cos(theta) * star.dimensions.width / 2,
            y: star.position.y + Math.sin(theta) * star.dimensions.height / 2
        })
    }

    const innerDistance = (Math.PI / (2 * n)) / (Math.PI - ((3 * Math.PI) / (2 * n))) + .05
    for (let theta = (Math.PI / -2) + (Math.PI / n); theta < (1.5 * Math.PI); theta += (2 * Math.PI / n)) {
        inner.push({
            x: star.position.x + Math.cos(theta) * star.dimensions.width * innerDistance,
            y: star.position.y + Math.sin(theta) * star.dimensions.height * innerDistance
        })
    }

    let triangles = []

    for (let i = 0; i < n; i++) {
        const across = (i + Math.floor(n / 2)) % n
        const innerPointIndex1 = (across - 1 + n) % n
        const innerPointIndex2 = (across + 1) % n

        const x1 = outer[i].x
        const y1 = outer[i].y
        const x2 = inner[innerPointIndex1].x
        const y2 = inner[innerPointIndex1].y
        const x3 = inner[innerPointIndex2].x
        const y3 = inner[innerPointIndex2].y

        triangles.push(x1, y1, 0, x2, y2, 0, x3, y3, 0)
    }

    const float32Array = new Float32Array(triangles)
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW)
    gl.drawArrays(gl.TRIANGLES, 0, n * 3)
}

const renderCube = (cube) => {
    let geometry = [
        0, 0, 0, 0, 30, 0, 30, 0, 0,
        0, 30, 0, 30, 30, 0, 30, 0, 0,
        0, 0, 30, 30, 0, 30, 0, 30, 30,
        0, 30, 30, 30, 0, 30, 30, 30, 30,
        0, 30, 0, 0, 30, 30, 30, 30, 30,
        0, 30, 0, 30, 30, 30, 30, 30, 0,
        0, 0, 0, 30, 0, 0, 30, 0, 30,
        0, 0, 0, 30, 0, 30, 0, 0, 30,
        0, 0, 0, 0, 0, 30, 0, 30, 30,
        0, 0, 0, 0, 30, 30, 0, 30, 0,
        30, 0, 30, 30, 0, 0, 30, 30, 30,
        30, 30, 30, 30, 0, 0, 30, 30, 0
    ]

    geometry = new Float32Array(geometry)
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)

    let normals = new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

const addShape = (translation, scale, rotation) => {
    const type = document.querySelector("input[name='shape']:checked").value
    const color = webglUtils.hexToRgb(document.getElementById("color").value)
    const tx = translation ? translation.x : 0
    const ty = translation ? translation.y : 0
    const tz = translation ? translation.z : 0
    const sx = scale ? scale.x : 1
    const sy = scale ? scale.y : 1
    const sz = scale ? scale.z : 1
    const rx = rotation ? rotation.x : 0
    const ry = rotation ? rotation.y : 0
    const rz = rotation ? rotation.z : 0

    const shape = {
        type: type,
        position: origin,
        dimensions: sizeOne,
        color: color,
        translation: { x: tx, y: ty, z: tz },
        scale: { x: sx, y: sy, z: sz },
        rotation: { x: rx, y: ry, z: rz }
    }

    shapes.push(shape)
    selectShape(shapes.length - 1) // for convenience, select the new shape
    render()
}
