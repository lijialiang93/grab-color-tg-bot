const util = require("util");
const sharp = require("sharp");
const kmeans = require("node-kmeans");
const clusterize = util.promisify(kmeans.clusterize);
const { createCanvas } = require("canvas");

const imageWidth = 512;
const colorWidth = 400;
const hexTextX = 430;
const offset = 50;

const MAX_HEIGHT = 512;

const stream2buffer = (stream) => {
  return new Promise((resolve, reject) => {
    const _buf = [];
    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));
  });
};

const getVectors = async (path) => {
  const image = sharp(path);
  const { height, width } = await image.metadata();
  let rHeight = height;
  let rWidth = width;

  if (height > MAX_HEIGHT) {
    rHeight = MAX_HEIGHT;
    rWidth = parseInt(width / (height / MAX_HEIGHT));
  }

  const { data } = await sharp(path)
    .resize({ height: rHeight, width: rWidth })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelArray = new Uint8ClampedArray(data.buffer);

  const offset = 3;
  const vectors = new Array();

  for (let i = 0; i < pixelArray.length; i += offset) {
    vectors.push([pixelArray[i], pixelArray[i + 1], pixelArray[i + 2]]);
  }

  return vectors;
};

const applyKmeans = async (vectors, k) => {
  const colors = [];
  const res = await clusterize(vectors, { k });
  for (const point of res) {
    const [r, g, b] = point.centroid;
    const hex = RGBToHex(Math.floor(r), Math.floor(g), Math.floor(b));
    const percentage = (point.cluster.length / vectors.length).toFixed(4);
    colors.push({ hex, percentage });
  }

  return colors;
};

const RGBToHex = (r, g, b) => {
  r = r.toString(16).toUpperCase();
  g = g.toString(16).toUpperCase();
  b = b.toString(16).toUpperCase();

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;

  return "#" + r + g + b;
};

const createColorDataImage = (colors) => {
  const height = offset * colors.length;
  const canvas = createCanvas(imageWidth, height);
  const ctx = canvas.getContext("2d");

  //background color
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0, startY = 0; i < colors.length; i++, startY += offset) {
    const color = colors[i];
    ctx.fillStyle = color.hex;
    ctx.fillRect(0, startY, colorWidth, offset);
    ctx.font = "14px";
    ctx.fillText(color.hex, hexTextX, startY + 30);
  }
  return canvas.toBuffer();
};

const createHexColorImage = (hex, width, height) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toBuffer();
};

module.exports = {
  stream2buffer,
  applyKmeans,
  getVectors,
  createColorDataImage,
  createHexColorImage,
};
