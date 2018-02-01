// ****************************************************************************************************
// Rewrite to add transparent square in `svg-min/`
// This ensures precise 24x24 pixel copy/pasting and placement to design apps (i.e. Sketch)

module.exports = function( grunt ) {
  grunt.registerMultiTask( 'svg-transform-add-square', 'Add transparent square to SVGs', function() {

    // Add stuff
		this.filesSrc.forEach( function( svgFile ) {

			// Grab the relevant bits from the file contents
			var fileContent = grunt.file.read( 'svg-min/' + svgFile );

			// Add transparent rectangle to each file
			var insertAt = fileContent.indexOf( '>' ) + 1;
			fileContent = fileContent.slice( 0, insertAt ) +
						'<rect x="0" fill="none" width="24" height="24"/>' +
						fileContent.slice( insertAt );

			// Save and overwrite the files in svg-min
			grunt.file.write( 'svg-min/' + svgFile, fileContent );

		} );
	} );
};
