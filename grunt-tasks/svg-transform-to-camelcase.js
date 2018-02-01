// ****************************************************************************************************
// Transform to Kebob to CamelCase for React (`svg-min/` --> `svg-min-react/`)

var xml2js = require( 'xml2js' );

/**
 * Transforms kebab case names to camel case
 * @param name        ex: foo-bar-baz
 * @returns {String}  ex: fooBarBaz
 */
function kebabToCamelCase( name ) {
  var KEBAB_REGEX = /\-(\w)/g;

	return name.replace( KEBAB_REGEX, function replacer( match, capture ) {
		return capture.toUpperCase();
	} );
}

module.exports = function( grunt ) {
  grunt.registerMultiTask( 'svg-transform-to-camelcase', 'Rename any SVG attributes to camel case for React', function() {

		// Add stuff
    this.files.forEach( function( files ) {
      files.src.forEach( function( svgFile ) {
  			// Grab the relevant bits from the file contents
  			var fileContent = grunt.file.read( files.cwd + svgFile );

  			// Rename any attributes to camel case for react
  			xml2js.parseString( fileContent, {
  					async: false, // set callback is sync, since this task is sync
  					trim: true,
  					attrNameProcessors: [ kebabToCamelCase ]
  				},
  				function ( err, result ) {
  					if ( ! err ) {
  						var builder = new xml2js.Builder( {
  							renderOpts: { pretty: false },
  							headless: true //omit xml header
  						} );
  						fileContent = builder.buildObject( result );
  					}
  				} );

  			grunt.file.write( files.dest + svgFile, fileContent );
  		} );
    } );
	} );
};
