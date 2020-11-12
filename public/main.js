const main = () => {
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl");

    const shaderProgram = initializeShaderProgram(gl)
    const parameters = getProgramParameters(gl, shaderProgram);
}
