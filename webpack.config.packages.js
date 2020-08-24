const path = require( "path" );

module.exports = [{
  mode: 'production',
  context: path.resolve( __dirname, "packages/lazy-images/src/js" ),
  entry: "./lazy-images.js",
  output: {
    path: path.resolve( __dirname, "packages/lazy-images/src/js" ),
    filename: "lazy-images.min.js"
  },
}];
