// ****************************************************************************************************
// Create React component (`svg-min-react/` --> `build/`)

module.exports = function( grunt ) {
  grunt.registerMultiTask( 'svg-to-react', 'Output a react component for SVGs', function() {
    var component = '';
    var componentExample = '';
    var filesDest;

    // Create a switch() case for each svg file
    this.files.forEach( function( files ) {
      files.src.forEach( function( svgFile ) {
        // Clean up the filename to use for the react components
        var name = svgFile.split( '.' );
        name = name[0];

        // Grab the relevant bits from the file contents
        var fileContent = grunt.file.read( files.cwd + svgFile );

        // Add className, height, and width to the svg element
        fileContent = fileContent.slice( 0, 4 ) +
              ' className={ iconClass } height={ size } width={ size } onClick={ onClick } { ...otherProps }' +
              fileContent.slice( 4, -6 ) +
              fileContent.slice( -6 );

        // Output the case for each icon
        component += "			case '" + name + "':\n" +
                  "				svg = " + fileContent + ";\n" +
                  "				break;\n";;

        // Example Document
        name = name.replace( 'social-logo-', '' );
        componentExample += '				<SocialLogo icon="' + name + '" size={ 48 } onClick={ this.handleClick.bind( this, \'' + name + '\' ) } />\n';


      } );

      filesDest = files.dest;
    } );

    // React Component Wrapping
    component = grunt.file.read( 'sources/react/index-header.jsx' ) + component;
    component += grunt.file.read( 'sources/react/index-footer.jsx' );

    // Design Docs Wrapping
    componentExample = grunt.file.read( 'sources/react/example-header.jsx' ) + componentExample;
    componentExample +=	grunt.file.read( 'sources/react/example-footer.jsx' );


    // Write the React component to build/index.jsx
    grunt.file.write( filesDest + 'index.jsx', component );
    grunt.file.write( filesDest + 'example.jsx', componentExample );
  } );
};
