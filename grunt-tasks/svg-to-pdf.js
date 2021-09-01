// ****************************************************************************************************
// Create PDF version (`svg-min/` --> `pdf/`)

var svg2pdfkit = require( 'svg-to-pdfkit' );
var PDFDocument = require( 'pdfkit' );
var fs = require( 'fs' );

module.exports = function( grunt ) {
  grunt.registerMultiTask('svg-to-pdf', 'Convert SVG to PDF', function() {
    var self = this;

    // Add stuff
    this.files.forEach( function( files ) {
      files.src.forEach( function( svgFile ) {
        // Grab the relevant bits from the file contents
        var fileContent = grunt.file.read( files.cwd + svgFile );

        // PDFkit writes to a stream, so it has to be async
        var done = self.async();
        var pdf = new PDFDocument( { size: [ 24, 24 ] } );
        pdf.info.CreationDate = "";
        pdf.pipe( fs.createWriteStream( files.dest + svgFile.slice(0, -4) + '.pdf' ) );
        pdf.on('finish', function() { done(); });

        svg2pdfkit(pdf, fileContent, 0, 0 );
        pdf.end();
      } );
    } );
  } );
};
