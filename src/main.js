const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require("canvas");
const buildDir = `${basePath}/build`;
// const layersDir = `${basePath}/layers`;
const layersDir = `${basePath}/../art`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require(`${basePath}/src/config.js`);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
const canvasWoBg = createCanvas(format.width, format.height);
const ctxWoBg = canvasWoBg.getContext("2d");
ctxWoBg.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const selectedTraitsList = new Set();
const HashlipsGiffer = require(`${basePath}/modules/HashlipsGiffer.js`);
const POLICY_ID = "tobereplaced";

const {
  selectTraits,
  createDna,
  isDnaUnique,
  constructLayerToDna,
  filterDNAOptions,
} = require("./dna");
const { needsExclusion } = require("./exclusions");
// const { saveImage } = require("./io");
const { saveImage, saveImageWoBG } = require("./io");

let hashlipsGiffer = null;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
  fs.mkdirSync(`${buildDir}/images/character`);
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`);
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));
  return layers;
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

// const addMetadata = (_dna, _edition) => {
//   let dateTime = Date.now();
//   let tempMetadata = {
//     name: `${namePrefix} #${_edition}`,
//     description: description,
//     image: `${baseUri}/${_edition}.png`,
//     imageCharacter: `${baseUri}/character/${_edition}.png`,
//     dna: sha1(_dna),
//     edition: _edition,
//     date: dateTime,
//     ...extraMetadata,
//     attributes: attributesList,
//     compiler: "HashLips Art Engine",
//   };
//   if (network == NETWORK.sol) {
//     tempMetadata = {
//       //Added metadata for solana
//       name: tempMetadata.name,
//       symbol: solanaMetadata.symbol,
//       description: tempMetadata.description,
//       //Added metadata for solana
//       seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
//       image: `image.png`,
//       //Added metadata for solana
//       external_url: solanaMetadata.external_url,
//       edition: _edition,
//       ...extraMetadata,
//       attributes: tempMetadata.attributes,
//       properties: {
//         files: [
//           {
//             uri: "image.png",
//             type: "image/png",
//           },
//         ],
//         category: "image",
//         creators: solanaMetadata.creators,
//       },
//     };
//   }
//   metadataList.push(tempMetadata);
//   attributesList = [];
// };

const traitToAttrStarts = (traitType) => {
  return attributesList
    .find((attr) => attr.trait_type.startsWith(traitType))
    ?.value?.replace(/_/g, " ");
};

const traitToAttrEnd = (traitType) => {
  return attributesList
    .find((attr) => attr.trait_type.endsWith(traitType))
    ?.value?.replace(/_/g, " ");
};

const traitToEyes = () => {
  const eyesCount = attributesList
    .find((attr) => attr.trait_type.endsWith("Iris"))
    ?.trait_type.split("/")[1];
  const eyesColor = attributesList.find((attr) =>
    attr.trait_type.endsWith("Iris")
  )?.value;
  return `${eyesCount}: ${eyesColor}`.replace(/_/g, " ");
};

const numberToWord = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];

const traitToPlanets = () => {
  const planetsCountInt = attributesList
    .find((attr) => attr.trait_type.endsWith("Planet"))
    ?.value.split("_").length;
  const planetsCount = numberToWord[planetsCountInt];
  const planetsNames = attributesList.find((attr) =>
    attr.trait_type.endsWith("Planet")
  )?.value;
  return `${planetsCount}: ${planetsNames}`.replace(/_/g, " ");
};

const isSpaceShip = () => {
  const hasSpaceShip = attributesList.find((attr) =>
    attr.trait_type.startsWith("Spaceship/")
  );
  // console.log("hasSpaceShip => ", hasSpaceShip);

  return !!hasSpaceShip;
};

const addMetadata = (_dna, _edition) => {
  // console.log("isSpaceShip: ", isSpaceShip());

  let tempMetadata;
  if (isSpaceShip()) {
    tempMetadata = {
      721: {
        [POLICY_ID]: {
          [`ClayInvaders${_edition}`]: {
            name: `${namePrefix} #${_edition}`,
            description: [
              "ClayInvaders invading galaxies and #Cardano with their",
              " magical, mysterious and clumsy ways.",
            ],
            image: `${baseUri}/${_edition}.png`,
            files: [
              {
                mediaType: "image/png",
                src: `${baseUri}/${_edition}.png`,
              },
            ],
            mediaType: "image/png",
            Attributes: {
              Galaxy: traitToAttrStarts("Galaxy"),
              Spaceship: traitToAttrStarts("Spaceship"),
              Planets: traitToPlanets(),
            },
            Publisher: "www.clayinvaders.art",
            Twitter: "@clayinvaders",
            Discord: "tbd",
          },
        },
      },
    };
  } else {
    tempMetadata = {
      721: {
        [POLICY_ID]: {
          [`ClayInvaders${_edition}`]: {
            name: `${namePrefix} #${_edition}`,
            description: [
              "ClayInvaders invading galaxies and #Cardano with their",
              " magical, mysterious and clumsy ways.",
            ],
            image: `${baseUri}/${_edition}.png`,
            files: [
              {
                mediaType: "image/png",
                src: `${baseUri}/${_edition}.png`,
              },
            ],
            mediaType: "image/png",
            Attributes: {
              Galaxy: traitToAttrStarts("Galaxy"),
              Spaceship: traitToAttrStarts("Spaceships"),
              Planets: traitToPlanets(),
              Pet: traitToAttrStarts("Pet"),
              Horns: traitToAttrStarts("Horns"),
              Body: traitToAttrStarts("Body"),
              Bandages_Body: traitToAttrStarts("Bandages_Body"),
              Eyes: traitToEyes(),
              Brows: traitToAttrStarts("Eyes_Brows"),
              Mouth: traitToAttrStarts("Mouth"),
              Bandages_Head: traitToAttrStarts("Bandages"),
              Accessories: traitToAttrStarts("Accessories"),
            },
            Publisher: "www.clayinvaders.art",
            Twitter: "@clayinvaders",
            Discord: "tbd",
          },
        },
      },
    };
  }

  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  return new Promise(async (resolve) => {
    if (!_layer.selectedElement) console.log("_layer", _layer);
    // console.log(_layer.selectedElement);
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  // console.log(_renderObject.layer.name);
  if (_renderObject.layer.name !== "Background") {
    ctxWoBg.globalAlpha = _renderObject.layer.opacity;
    ctxWoBg.globalCompositeOperation = _renderObject.layer.blend;
    ctxWoBg.drawImage(
      _renderObject.loadedImage,
      0,
      0,
      format.width,
      format.height
    );
  }
  addAttributes(_renderObject);
};

// const saveMetaDataSingleFile = (_editionCount) => {
//   let metadata = metadataList.find((meta) => meta.edition == _editionCount);
//   debugLogs
//     ? console.log(
//         `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
//       )
//     : null;
//   fs.writeFileSync(
//     `${buildDir}/json/${_editionCount}.json`,
//     JSON.stringify(metadata, null, 2)
//   );
// };
const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => {
    for (var k in meta[721][POLICY_ID]) {
      break;
    }
    return k === `ClayInvaders${_editionCount}`;
  });
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/ClayInvaders #${_editionCount}.metadata`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = network == NETWORK.sol ? 0 : 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      const traits = selectTraits(layers);
      const newDna = createDna(traits);
      if (!isDnaUnique(dnaList, newDna)) {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
        continue;
      }

      const maxRepeatedTraits =
        layerConfigurations[layerConfigIndex].maxRepeatedTraits;
      const incompatibleTraits =
        layerConfigurations[layerConfigIndex].incompatibleTraits;
      if (
        needsExclusion(
          selectedTraitsList,
          traits,
          maxRepeatedTraits,
          incompatibleTraits
        )
      ) {
        console.log(
          "Combination of traits excluded because of exclusion rules!",
          traits
        );
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
        continue;
      }

      let results = constructLayerToDna(newDna, layers);
      let loadedElements = [];

      results.forEach((layer) => {
        loadedElements.push(loadLayerImg(layer));
      });

      await Promise.all(loadedElements).then((renderObjectArray) => {
        debugLogs ? console.log("Clearing canvas") : null;
        ctx.clearRect(0, 0, format.width, format.height);
        ctxWoBg.clearRect(0, 0, format.width, format.height);
        if (gif.export) {
          hashlipsGiffer = new HashlipsGiffer(
            canvas,
            ctx,
            `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
            gif.repeat,
            gif.quality,
            gif.delay
          );
          hashlipsGiffer.start();
        }
        if (background.generate) {
          drawBackground();
        }
        renderObjectArray.forEach((renderObject, index) => {
          drawElement(
            renderObject,
            index,
            layerConfigurations[layerConfigIndex].layersOrder.length
          );
          if (gif.export) {
            hashlipsGiffer.add();
          }
        });
        if (gif.export) {
          hashlipsGiffer.stop();
        }
        debugLogs
          ? console.log("Editions left to create: ", abstractedIndexes)
          : null;

        const paddedIndex = abstractedIndexes[0].toString().padStart(5, "0");

        saveImage(paddedIndex, canvas, buildDir);
        // saveImageWoBG(paddedIndex, canvasWoBg, buildDir);
        addMetadata(newDna, paddedIndex);
        saveMetaDataSingleFile(paddedIndex);
        console.log(
          `Created edition: ${paddedIndex}, with DNA: ${sha1(newDna)}`
        );
      });
      dnaList.add(filterDNAOptions(newDna));
      selectedTraitsList.add(traits);
      editionCount++;
      abstractedIndexes.shift();
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
