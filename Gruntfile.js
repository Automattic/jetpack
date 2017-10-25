/*
 * Export social Icon
 */

'use strict';

var multiline = require('multiline'),
	xml2js = require('xml2js');

var KEBAB_REGEX = /\-(\w)/g;

/**
 * Transforms kebab case names to camel case
 * @param name        ex: foo-bar-baz
 * @returns {String}  ex: fooBarBaz
 */
function kebabToCamelCase( name ) {
	return name.replace( KEBAB_REGEX, function replacer( match, capture ) {
		return capture.toUpperCase();
	} );
}

module.exports = function( grunt ) {

	require( 'load-grunt-tasks' )( grunt );

	// Project configuration.
	grunt.initConfig({

		clean: [ 'svg-min-react' ],

		// Minify SVGs from svg directory, output to svg-min
		svgmin: {
			dist: {
				files: [{
					attrs: 'fill',
					expand: true,
					cwd: 'svg',
					src: ['*.svg'],
					dest: 'svg-min/',
					ext: '.svg'
				}]
			},
			options: {
				plugins: [
					{ removeAttrs: { attrs: ['fill', 'id', 'style'] } },
					{ removeViewBox: false },
					{ removeEmptyAttrs: false }
				]
			}
		},

		// Create single SVG sprite for use outside of React environments, output to svg-sprite
		svgstore: {
			withCustomTemplate:{
				options: {
					prefix : '', // Unused by us, but svgstore demands this variable
					svg: { // will add and overide the the default xmlns="http://www.w3.org/2000/svg" attribute to the resulting SVG
						viewBox : '0 0 24 24',
						xmlns: 'http://www.w3.org/2000/svg'
					},

					cleanup : ['style', 'fill', 'id'],

					includedemo : multiline.stripIndent(function(){/*
					<!DOCTYPE html>
					<html>
					<head>
					<title>Social Logos</title>
					<meta name="robots" content="noindex">
					<link rel="stylesheet" type="text/css" href="social-logos-demo.css" />
					<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
					<script src="social-logos-demo.js"></script>
					</head>
					<body>

					<h1>Social Logos</h1>
					<p><strong>This <code>use</code> based technique doesn't work in IE yet. It's here for a future where it will work.<strong></p>

					{{{svg}}}

					<div id="icons">
					{{#each icons}}
						<div>
							<svg width="24" height="24" class="social-logo {{name}}">
							<use xlink:href="#{{name}}" />
							</svg>
							<p>{{title}}</p>
						</div>
					{{/each}}
					</div>

					</body>
					</html>
					*/})

				},
				files: {
					'svg-sprite/social-logos.svg': ['svg/*.svg']
				}
			},
		},

		rename: {
			moveThis: {
					src: 'svg-sprite/social-logos-demo.html',
					dest: 'svg-sprite/index.html'
			},
		},

		// generate a web font
		webfont: {
			icons: {
				src: 'svg/*.svg',
				dest: 'icon-font'
			},
			options: {
				'font': 'social-logos',
				'types': 'eot,woff2,woff,ttf',
				'order': 'eot,woff,ttf',
				'embed': true,
				templateOptions: {
					baseClass: 'social-logo',
					classPrefix: 'social-logo__',
					mixinPrefix: 'social-logo-'
				},
				codepointsFile: 'codepoints.json'
			}
		},

		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: 'icon-font/',
					src: ['*.css', '!*.min.css'],
					dest: 'icon-font/',
					ext: '.min.css'
				}]
			}
		},

		babel: {
			options: {
				sourceMap: false,
				presets: [
					'es2015',
					'stage-2',
					'babili'
				],
				comments: false,
				plugins: [
					'transform-runtime',
					'transform-class-properties',
					'transform-export-extensions',
					'add-module-exports',
					'syntax-jsx',
					'transform-react-jsx',
					'transform-react-display-name'
				]
			},
			dist: {
				files: {
					"build/index.js": "build/index.jsx",
					"build/example.js": "build/example.jsx"
				}
			}
		}
	});

	// Load the copier
	grunt.loadNpmTasks('grunt-contrib-copy');

	// Load the SVGstore
	grunt.loadNpmTasks('grunt-svgstore');

	// Load the renamer
	grunt.loadNpmTasks('grunt-rename');

	// Load svgmin
	grunt.loadNpmTasks('grunt-svgmin');

	// load the webfont creater
	grunt.loadNpmTasks('grunt-webfont');

	// minify css files
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// load svn 2 png
	grunt.loadNpmTasks('grunt-svg2png');

	// Update all files in svg-min to add a <g> group tag
	grunt.registerTask( 'group', 'Add <g> tag to SVGs', function() {
		var svgFiles = grunt.file.expand( { filter: 'isFile', cwd: 'svg-min/' }, [ '**/*.svg' ] );

		// Add stuff
		svgFiles.forEach( function( svgFile ) {

			// Grab the relevant bits from the file contents
			var fileContent = grunt.file.read( 'svg-min/' + svgFile );

			// Add transparent rectangle to each file
			fileContent = fileContent.slice( 0, fileContent.indexOf('viewBox="0 0 24 24">') + 20 ) +	// opening SVG tag
						'<g>' +
						fileContent.slice( fileContent.indexOf('viewBox="0 0 24 24">') + 20, -6 ) + 	// child elements of SVG
						'</g>' +
						fileContent.slice( -6 );	// closing SVG tag

			// Save and overwrite the files in svg-min
			grunt.file.write( 'svg-min/' + svgFile, fileContent );

		} );

	});

	grunt.registerTask( 'kebabToCamelCase', 'Rename any svg attributes to camel case for react', function() {
		var svgFiles = grunt.file.expand( { filter: 'isFile', cwd: 'svg-min/' }, [ '**/*.svg' ] );

		// Add stuff
		svgFiles.forEach( function( svgFile ) {

			// Grab the relevant bits from the file contents
			var fileContent = grunt.file.read( 'svg-min/' + svgFile );

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

			grunt.file.write( 'svg-min-react/' + svgFile, fileContent );

		} );

	});

	// Create React component, output to react
	grunt.registerTask( 'svgreact', 'Output a react component for SVGs', function() {
		var svgFiles = grunt.file.expand( { filter: 'isFile', cwd: 'svg-min-react/' }, [ '**/*.svg' ] ),
			content, designContent;

		// Start the React component
		content =	grunt.file.read( 'react/social-logo/inc/index-header.jsx' );

		// Create a switch() case for each svg file
		svgFiles.forEach( function( svgFile ) {
			// Clean up the filename to use for the react components
			var name = svgFile.split( '.' );
			name = name[0]; // remove the logo- part from the name

			// Grab the relevant bits from the file contents
			var fileContent = grunt.file.read( 'svg-min-react/' + svgFile );

			// Add className, height, and width to the svg element
			fileContent = fileContent.slice( 0, 4 ) +
						' className={ iconClass } height={ size } width={ size } onClick={ onClick }' +
						fileContent.slice( 4, -6 ) +
						fileContent.slice( -6 );

			// Output the case for each icon
			var iconComponent = "			case '" + name + "':\n" +
								"				svg = " + fileContent + ";\n" +
								"				break;\n";

			content += iconComponent;
		} );

		// Finish up the React component
		content += grunt.file.read( 'react/social-logo/inc/index-footer.jsx' );

		// Start design/docs component
		designContent =
					"/**\n" +
					" * External dependencies\n" +
					" */\n" +
					"import React, { PureComponent } from 'react';\n\n" +
					"/**\n" +
					" * Internal dependencies\n" +
					" */\n" +
					"import SocialLogo from './index.js';\n\n" +
					"export default class extends PureComponent {\n" +
					"	static displayName = 'SocialLogos';\n\n" +
					"	handleClick = icon => {\n" +
					"		const toCopy = '<SocialLogo icon=\"' + icon + '\" />';\n" +
					"		window.prompt( 'Copy component code:', toCopy );\n" +
					"	};\n\n" +
					"	render() {\n" +
					'		return (\n' +
					'			<div>\n';

		// Create a switch() case for each svg file
		svgFiles.forEach( function( svgFile ) {
			// Clean up the filename to use for the react components
			let name = svgFile.split( '.' );

			name = name[0].replace( 'social-logo-', '' );

			// Output the case for each icon
			let iconComponent = '				<SocialLogo icon="' + name + '" size={ 48 } onClick={ this.handleClick.bind( this, \'' + name + '\' ) } />\n';
			designContent += iconComponent;
		} );

		designContent +=	'			</div>\n' +
							'		);\n' +
							'	}\n' +
							'}\n';

		// Write the React component to social-logo/index.jsx
		grunt.file.write( 'build/index.jsx', content );
		grunt.file.write( 'build/example.jsx', designContent );
	});

	// Update all files in svg-min to add transparent square, this ensures copy/pasting to Sketch maintains a 24x24 size
	grunt.registerTask( 'addsquare', 'Add transparent square to SVGs', function() {
		var svgFiles = grunt.file.expand( { filter: 'isFile', cwd: 'svg-min/' }, [ '**/*.svg' ] );

		// Add stuff
		svgFiles.forEach( function( svgFile ) {

			// Grab the relevant bits from the file contents
			var fileContent = grunt.file.read( 'svg-min/' + svgFile );


			// Add transparent rectangle to each file
			fileContent = fileContent.slice( 0, fileContent.indexOf('viewBox="0 0 24 24">') + 20 ) +
						'<rect x="0" fill="none" width="24" height="24"/>' +
						fileContent.slice( fileContent.indexOf('viewBox="0 0 24 24">') + 20, -6 ) +
						fileContent.slice( -6 );

			// Save and overwrite the files in svg-min
			grunt.file.write( 'svg-min/' + svgFile, fileContent );

		} );

	});

	// Default task(s).

	grunt.registerTask( 'default', [ 'svgmin', 'group', 'svgstore', 'rename', 'kebabToCamelCase', 'svgreact', 'babel', 'webfont', 'cssmin','addsquare', 'clean' ] );

};
