const path = require("path");
const webpack = require('webpack')

module.exports = {
  mode: "production",
  context: path.resolve(__dirname, "src/js"),
  entry: "./lazy-images.js",
  output: {
    path: path.resolve(__dirname, "src/js"),
    filename: "lazy-images.min.js"
  },
}
