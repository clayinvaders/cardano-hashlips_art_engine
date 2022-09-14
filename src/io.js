const fs = require("fs");

const saveImage = (_editionCount, canvas, buildDir) => {
  fs.writeFileSync(
    `${buildDir}/images/ClayInvaders #${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};
const saveImageWoBG = (_editionCount, canvas, buildDir) => {
  fs.writeFileSync(
    `${buildDir}/images/character/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

module.exports = {
  saveImage,
  saveImageWoBG,
};
