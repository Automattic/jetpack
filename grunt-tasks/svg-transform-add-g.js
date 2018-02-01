// ****************************************************************************************************
// Rewrite to add <g> group tag in `svg-min/`
// This is used to target directly the content of the SVG.
// It's also used by the offset fix for 18px size.

module.exports = function( grunt ) {
  grunt.registerMultiTask( 'svg-transform-add-g', 'Add <g> tag to SVGs', function() {

		// Add stuff
		this.filesSrc.forEach( function( svgFile ) {

			// Grab the relevant bits from the file contents
			var fileContent = grunt.file.read( 'svg-min/' + svgFile );

			// Add <g> to each file
      fileContent = fileContent.replace( /<svg[^>]*>/i, '$&<g>' ); // add <g> after <svg>
      fileContent = fileContent.replace( /<\/svg>/i, '</g>$&' ); // add </g> before </svg>

			// Save and overwrite the files in svg-min
			grunt.file.write( 'svg-min/' + svgFile, fileContent );

		} );
	} );
};
