const hexToRgb = (hex) => {
    let parseRgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let rgb = {
        red: parseInt(parseRgb[1], 16),
        green: parseInt(parseRgb[2], 16),
        blue: parseInt(parseRgb[3], 16)
    }
    rgb.red /= 256
    rgb.green /= 256
    rgb.blue /= 256
    return rgb
}

const createProgramFromScripts = (gl, vertexShaderElementId, fragmentShaderElementId) => {
    // Get the strings for our GLSL shaders
    const vertexShaderSource = document.querySelector(vertexShaderElementId).text;
    const fragmentShaderSource = document.querySelector(fragmentShaderElementId).text;

    // Create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Link the two shaders into a program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program
}

const shapeTypes = {
    rectangle: "RECTANGLE",
    triangle: "TRIANGLE"
}
let shapes = []
let gl, attributeCoords, uniformColor, bufferCoords

const doMouseDown = (event) => {
    const boundingRectangle = canvas.getBoundingClientRect();
    const x = event.clientX - boundingRectangle.left;
    const y = event.clientY - boundingRectangle.top;
    const center = { position: { x, y } }

    addShape(center)
}

const init = () => {
    // get a reference to the canvas and WebGL context
    const canvas = document.querySelector("#canvas");

    canvas.addEventListener("mousedown", doMouseDown, false);

    gl = canvas.getContext("webgl");

    // create and use a GLSL program
    const program = createProgramFromScripts(gl, "#vertex-shader-2d", "#fragment-shader-2d");
    gl.useProgram(program);

    // get reference to GLSL attributes and uniforms
    attributeCoords = gl.getAttribLocation(program, "a_coords");
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
}

const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 2, gl.FLOAT, false, 0, 0);

    shapes.forEach(shape => {
        gl.uniform4f(uniformColor, shape.color.red, shape.color.green, shape.color.blue, 1);

        switch (shape.type) {
            case shapeTypes.rectangle:
                renderRectangle(shape);
                break;
            case shapeTypes.triangle:
                renderTriangle(shape);
                break;
            default:
                console.log(`Unexpected ShapeType encountered: ${shape.type}`)
        }
    })
}

const renderRectangle = (rectangle) => {
    const x1 = rectangle.center.x
        - rectangle.dimensions.width / 2;
    const y1 = rectangle.center.y
        - rectangle.dimensions.height / 2;
    const x2 = rectangle.center.x
        + rectangle.dimensions.width / 2;
    const y2 = rectangle.center.y
        + rectangle.dimensions.height / 2;

    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([
            x1, y1, x2, y1, x1, y2,
            x1, y2, x2, y1, x2, y2,
        ]), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const renderTriangle = (triangle) => {
    const x1 = triangle.center.x
        - triangle.dimensions.width / 2
    const y1 = triangle.center.y
        + triangle.dimensions.height / 2
    const x2 = triangle.center.x
        + triangle.dimensions.width / 2
    const y2 = triangle.center.y
        + triangle.dimensions.height / 2
    const x3 = triangle.center.x
    const y3 = triangle.center.y
        - triangle.dimensions.height / 2

    const float32Array = new Float32Array([
        x1, y1, x2, y2, x3, y3
    ])

    gl.bufferData(gl.ARRAY_BUFFER,
        float32Array, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const addShape = (center) => {
    const shapeType = document.querySelector("input[name='shape']:checked").value
    const x = center ? center.position.x : parseInt(document.getElementById("x").value)
    const y = center ? center.position.y : parseInt(document.getElementById("y").value)
    const width = parseInt(document.getElementById("width").value)
    const height = parseInt(document.getElementById("height").value)
    const color = hexToRgb(document.getElementById("color").value)

    const shape = {
        type: shapeType,
        center: { x, y },
        dimensions: { width, height },
        color: color
    }

    shapes.push(shape)
    render()
}
