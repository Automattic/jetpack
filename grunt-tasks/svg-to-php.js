// ****************************************************************************************************
// Create PHP WordPress plugin (`svg-min/` --> `php/`)

module.exports = function( grunt ) {
  grunt.registerMultiTask( 'svg-to-php', 'Output a PHP WordPress plugin for SVGs', function() {
    var filesDest;
    
		// Start the plugin
		var content = grunt.file.read( 'sources/php/index-header.php' );

    this.files.forEach( function( files ) {
  		// Create a switch() case for each svg file
  		files.src.forEach( function( svgFile ) {
  			// Clean up the filename to use for the react components
  			var name = svgFile.split( '.' );
  			name = name[0];

  			// Grab the relevant bits from the file contents
  			var fileContent = grunt.file.read( 'svg-min/' + svgFile );

  			// Add className, height, and width to the svg element
  			fileContent = fileContent.slice( 0, 4 ) +
  						' class="social-logo social-logo-' + name + '" height="24" width="24"' +
  						fileContent.slice( 4, -6 ) +
  						fileContent.slice( -6 );

  			// Output the case for each icon
  			var iconComponent = "		case '" + name + "':\n" +
  								"			$svg = '" + fileContent + "';\n" +
  								"			break;\n";

  			content += iconComponent;
  		} );
      
      filesDest = files.dest;
    } );

		// Finish up and write the plugin
		content += grunt.file.read( 'sources/php/index-footer.php' );
		grunt.file.write( filesDest, content );

	} );
};
