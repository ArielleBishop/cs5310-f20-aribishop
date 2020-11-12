// TODO: Upon deleting the last shape it is still rendered on canvas

const origin = { x: 0, y: 0 }
const sizeOne = { width: 1, height: 1 }
const RED_HEX = "#FF0000"
const RED_RGB = webglUtils.hexToRgb(RED_HEX)
const GREEN_HEX = "00FF00"
const GREEN_RGB = webglUtils.hexToRgb(GREEN_HEX)
const BLUE_HEX = "#0000FF"
const BLUE_RGB = webglUtils.hexToRgb(BLUE_HEX)

const shapeTypes = {
    rectangle: "RECTANGLE",
    triangle: "TRIANGLE",
    ellipse: "ELLIPSE",
    star: "STAR"
}

let shapes = [
    {
        type: shapeTypes.rectangle,
        position: origin,
        dimensions: sizeOne,
        color: BLUE_RGB,
        translation: { x: 200, y: 100 },
        rotation: { z: 0 },
        scale: { x: 50, y: 50 }
    },
    {
        type: shapeTypes.triangle,
        position: origin,
        dimensions: sizeOne,
        color: RED_RGB,
        translation: { x: 300, y: 100 },
        rotation: { z: 0 },
        scale: { x: 50, y: 50 }
    },
    {
        type: shapeTypes.ellipse,
        position: origin,
        dimensions: sizeOne,
        color: GREEN_RGB,
        translation: { x: 200, y: 200 },
        rotation: { z: 0 },
        scale: { x: 30, y: 30 }
    },
    {
        type: shapeTypes.star,
        position: origin,
        dimensions: sizeOne,
        color: BLUE_RGB,
        translation: { x: 300, y: 200 },
        rotation: { z: 0 },
        scale: { x: 70, y: 70 }
    },
]

let gl, attributeCoords, uniformMatrix, uniformColor, bufferCoords

const doMouseDown = (event) => {
    const boundingRectangle = canvas.getBoundingClientRect();
    const x = event.clientX - boundingRectangle.left;
    const y = event.clientY - boundingRectangle.top;
    const translation = { x, y }

    addShape(translation)
}

const init = () => {
    // get a reference to the canvas and WebGL context
    const canvas = document.querySelector("#canvas");

    canvas.addEventListener("mousedown", doMouseDown, false);

    gl = canvas.getContext("webgl");

    // create and use a GLSL program
    const program = webglUtils.createProgramFromScripts(gl, "#vertex-shader-2d", "#fragment-shader-2d");
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

    // configure canvas resolution and clear the canvas
    gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    document.getElementById("tx").onchange = event => updateTranslation(event, "x")
    document.getElementById("ty").onchange = event => updateTranslation(event, "y")

    document.getElementById("sx").onchange = event => updateScale(event, "x")
    document.getElementById("sy").onchange = event => updateScale(event, "y")

    document.getElementById("rz").onchange = event => updateRotation(event, "z")

    document.getElementById("color").onchange = event => updateColor(event)

    selectShape(0)
}

const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 2, gl.FLOAT, false, 0, 0);

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

        // compute transformation matrix
        let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        matrix = m3.translate(matrix, shape.translation.x, shape.translation.y);
        matrix = m3.rotate(matrix, shape.rotation.z);
        matrix = m3.scale(matrix, shape.scale.x, shape.scale.y);

        // apply transformation matrix.
        gl.uniformMatrix3fv(uniformMatrix, false, matrix);

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
            default:
                console.log(`Unexpected ShapeType encountered: ${shape.type}`)
        }
    })
}

let selectedShapeIndex = 0

const selectShape = (selectedIndex) => {
    selectedShapeIndex = selectedIndex
    document.getElementById("tx").value = shapes[selectedIndex].translation.x
    document.getElementById("ty").value = shapes[selectedIndex].translation.y
    document.getElementById("sx").value = shapes[selectedIndex].scale.x
    document.getElementById("sy").value = shapes[selectedIndex].scale.y
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

    render()
}

const updateTranslation = (event, axis) => {
    const value = event.target.value
    shapes[selectedShapeIndex].translation[axis] = value
    render()
}

const updateScale = (event, axis) => {
    const value = event.target.value
    shapes[selectedShapeIndex].scale[axis] = value
    render()
}

const updateRotation = (event, axis) => {
    const value = event.target.value
    const angleInDegrees = (360 - value) * Math.PI / 180;
    shapes[selectedShapeIndex].rotation[axis] = angleInDegrees
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
            x1, y1, x2, y1, x1, y2,
            x1, y2, x2, y1, x2, y2,
        ]), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const renderTriangle = (triangle) => {
    const x1 = triangle.position.x
        - triangle.dimensions.width / 2
    const y1 = triangle.position.y
        + triangle.dimensions.height / 2
    const x2 = triangle.position.x
        + triangle.dimensions.width / 2
    const y2 = triangle.position.y
        + triangle.dimensions.height / 2
    const x3 = triangle.position.x
    const y3 = triangle.position.y
        - triangle.dimensions.height / 2

    const float32Array = new Float32Array([
        x1, y1, x2, y2, x3, y3
    ])

    gl.bufferData(gl.ARRAY_BUFFER,
        float32Array, gl.STATIC_DRAW);

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

    let triangles = [points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y, ellipse.position.x, ellipse.position.y];

    for (let i = 0; i < points.length - 1; i++) {
        triangles.push(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, ellipse.position.x, ellipse.position.y)
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
        const across = (i + Math.floor(n/2)) % n
        const innerPointIndex1 = (across - 1 + n) % n
        const innerPointIndex2 = (across + 1) % n

        const x1 = outer[i].x
        const y1 = outer[i].y
        const x2 = inner[innerPointIndex1].x
        const y2 = inner[innerPointIndex1].y
        const x3 = inner[innerPointIndex2].x
        const y3 = inner[innerPointIndex2].y

        triangles.push(x1, y1, x2, y2, x3, y3)
    }

    const float32Array = new Float32Array(triangles)
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW)
    gl.drawArrays(gl.TRIANGLES, 0, n * 3)
}

const addShape = (translation, scale, rotation) => {
    const type = document.querySelector("input[name='shape']:checked").value
    const color = webglUtils.hexToRgb(document.getElementById("color").value)
    const tx = translation ? translation.x : 0
    const ty = translation ? translation.y : 0
    const sx = scale ? scale.x : 1
    const sy = scale ? scale.y : 1
    const rz = rotation ? rotation.z : 0

    const shape = {
        type: type,
        position: origin,
        dimensions: sizeOne,
        color: color,
        translation: { x: tx, y: ty, z: 0 },
        scale: { x: sx, y: sy, z: 1 },
        rotation: { x: 0, y: 0, z: rz }
    }

    shapes.push(shape)
    selectShape(shapes.length - 1) // for convenience, select the new shape
    render()
}
