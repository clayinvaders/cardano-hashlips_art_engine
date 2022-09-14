const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);
const { NETWORK } = require(`${basePath}/constants/network.js`);

const network = NETWORK.eth;

// General metadata for Ethereum
const namePrefix = "ClayInvaders";
const description = "Remember to replace this description";
const baseUri = "ipfs://NewUriToReplace";

const solanaMetadata = {
  symbol: "YC",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.youtube.com/c/hashlipsnft",
  creators: [
    {
      address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
      share: 100,
    },
  ],
};

const generateLayers = (bodyKey, bodyColor, eyesCount) => {
  let colorConfig = [
    { name: "Galaxy" },
    { name: "Spaceships" },
    { name: "Planet" },
    { name: "Pet" },
    { name: "Horns" },
    { name: `Body/${bodyKey}` },
    { name: `Bandages_Body/${bodyColor}` },
    { name: `Eyes_Brows/${eyesCount}` },
    { name: `Eyes/${eyesCount}` },
    { name: "Mouth" },
    { name: `Eyes/${eyesCount}/Iris` },
    { name: `Bandages` },
    { name: `Accessories` },
  ];
  return colorConfig;
};

const generateLayersWithSuit = (colorKey, suitKey, eyesCount) => {
  let colorConfig = [
    { name: "Galaxy" },
    { name: "Spaceships" },
    { name: "Planet" },
    { name: "Pet" },
    { name: "Horns" },
    { name: `Suit/${suitKey}` },
    { name: `Head/${colorKey}` },
    { name: `Eyes_Brows/${eyesCount}` },
    { name: `Eyes/${eyesCount}` },
    { name: "Mouth" },
    { name: `Eyes/${eyesCount}/Iris` },
    { name: `Bandages` },
    { name: `Accessories` },
  ];
  return colorConfig;
};

const generateLayersSpaceShips = (spaceShipKey) => {
  let spaceConfig = [
    { name: "Galaxy" },
    { name: "Planet" },
    { name: `Spaceship/${spaceShipKey}` },
  ];
  return spaceConfig;
};

const generateIncompatibles = (bodyColor, eyesCount) => {
  return {
    [`Eyes/${eyesCount}/Iris/Laser`]: [
      "Bandages/Complete",
      "Bandages/Frontal",
      "Bandages/Half_Right",
      "Bandages/Half_Left",
      "Accessories/Helmet_Red_Cardano",
      "Accessories/Helmet_Red_Invaders",
      "Accessories/Helmet_White_Invaders",
      "Accessories/Helmet_White_Cardano",
      "Mouth/Rainbow",
    ],
    ["Mouth/Rainbow"]: [
      "Bandages/Complete",
      "Accessories/Helmet_Red_Cardano",
      "Accessories/Helmet_Red_Invaders",
      "Accessories/Helmet_White_Invaders",
      "Accessories/Helmet_White_Cardano",
    ],
  };
};

let layerConfigurations = [];

const eyesTypes = ["One", "Two", "Three", "Five"];
const bodyTypes = {
  Violet__Violet: { body: "Violet", head: "Violet", suit: "", count: 700 },
  Black__Black: { body: "Black", head: "Black", suit: "", count: 700 },
  Yellow__Yellow: { body: "Yellow", head: "Yellow", suit: "", count: 800 },
  Blue__Blue: { body: "Blue", head: "Blue", suit: "", count: 800 },
  Orange__Orange: { body: "Orange", head: "Orange", suit: "", count: 1000 },
  Green__Green: { body: "Green", head: "Green", suit: "", count: 1100 },
  Turquoise__Turquoise: {
    body: "Turquoise",
    head: "Turquoise",
    suit: "",
    count: 1100,
  },
  Violet__Invisible: {
    body: "Violet",
    head: "Invisible",
    suit: "",
    count: 100,
  },
  Black__Invisible: { body: "Black", head: "Invisible", suit: "", count: 150 },
  Yellow__Invisible: {
    body: "Yellow",
    head: "Invisible",
    suit: "",
    count: 200,
  },
  Blue__Invisible: { body: "Blue", head: "Invisible", suit: "", count: 250 },
  Orange__Invisible: {
    body: "Orange",
    head: "Invisible",
    suit: "",
    count: 300,
  },
  Green__Invisible: { body: "Green", head: "Invisible", suit: "", count: 350 },
  Turquoise__Invisible: {
    body: "Turquoise",
    head: "Invisible",
    suit: "",
    count: 400,
  },
  _Commander_Invisible: {
    body: "",
    head: "Invisible",
    suit: "Commander",
    count: 5,
  },
  _Commander_Color: { body: "", head: "Color", suit: "Commander", count: 15 },
  _Pilot_Invisible: { body: "", head: "Invisible", suit: "Pilot", count: 30 },
  _Pilot_Color: { body: "", head: "Color", suit: "Pilot", count: 50 },
  _Engineer_Invisible: {
    body: "",
    head: "Invisible",
    suit: "Engineer",
    count: 100,
  },
  _Engineer_Color: { body: "", head: "Color", suit: "Engineer", count: 200 },
  _Explorer_Invisible: {
    body: "",
    head: "Invisible",
    suit: "Explorer",
    count: 100,
  },
  _Explorer_Color: { body: "", head: "Color", suit: "Explorer", count: 200 },
  _Navigator_Invisible: {
    body: "",
    head: "Invisible",
    suit: "Navigator",
    count: 100,
  },
  _Navigator_Color: { body: "", head: "Color", suit: "Navigator", count: 200 },
  _Doctor_Invisible: {
    body: "",
    head: "Invisible",
    suit: "Doctor",
    count: 150,
  },
  _Doctor_Color: { body: "", head: "Color", suit: "Doctor", count: 350 },
  _Scientist_Invisible: {
    body: "",
    head: "Invisible",
    suit: "Scientist",
    count: 150,
  },
  _Scientist_Color: { body: "", head: "Color", suit: "Scientist", count: 350 },
};

const spaceShips = {
  Discover: { count: 10 },
  Hypersonic: { count: 3 },
  Mindy: { count: 3 },
  Mork: { count: 3 },
  Night_Hunter: { count: 1 },
  Nostromuz: { count: 5 },
  Nuclear_Star: { count: 5 },
  Serenity: { count: 10 },
  Wolf_of_the_Night: { count: 10 },
};

let totalNFTs = 0;

Object.keys(spaceShips).forEach((spaceShipKey) => {
  totalNFTs += spaceShips[spaceShipKey].count;
  layerConfigurations.push({
    growEditionSizeTo: totalNFTs,
    layersOrder: generateLayersSpaceShips(spaceShipKey),
  });
});

Object.keys(bodyTypes).forEach((bodyTypeKey) => {
  totalNFTs += bodyTypes[bodyTypeKey].count;
  const eyesIndex = Math.floor(Math.random() * eyesTypes.length);
  let layersOrder;

  if (bodyTypes[bodyTypeKey]?.suit === "") {
    const bodyKeyName = `${bodyTypes[bodyTypeKey]?.body}_${bodyTypes[bodyTypeKey]?.head}`;
    layersOrder = generateLayers(
      bodyKeyName,
      bodyTypes[bodyTypeKey]?.body,
      eyesTypes[eyesIndex]
    );
  } else {
    layersOrder = generateLayersWithSuit(
      bodyTypes[bodyTypeKey]?.head,
      bodyTypes[bodyTypeKey]?.suit,
      eyesTypes[eyesIndex]
    );
  }

  layerConfigurations.push({
    growEditionSizeTo: totalNFTs,
    layersOrder,
    incompatibleTraits: generateIncompatibles(
      bodyTypeKey,
      eyesTypes[eyesIndex]
    ),
  });
});

console.log(layerConfigurations);

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 2000,
  height: 2000,
  smoothing: false,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
};
