/*
 * Export Social Logos
 */

'use strict';

module.exports = function( grunt ) {

  // Loads all tasks from `grunt-tasks/`
  grunt.loadTasks( 'grunt-tasks' );

  // Loads all `grunt-*`` tasks listed in package.json --> `devDependencies`
  require( 'load-grunt-tasks' )( grunt );

	// Project configuration.
	grunt.initConfig({

		// clean up tmp dirs
		clean: [ 'svg-min-react' ],

		// Minify SVGs from svg directory, output to svg-min
		svgmin: {
			dist: {
				files: [{
					attrs: 'fill',
					expand: true,
					cwd: 'sources/svg/',
					src: ['*.svg'],
					dest: 'svg-min/',
					ext: '.svg'
				}]
			},
			options: {
				plugins: [
					{ removeAttrs: { attrs: ['fill'] } },
					{ removeViewBox: false },
					{ removeEmptyAttrs: false },
					{ removeTitle: true } // addtitle will add it back in later
				]
			}
		},

		// Create single SVG sprite for use outside of React environments, output to svg-sprite
		svgstore: {
			withCustomTemplate:{
				options: {
					includeTitleElement: false,
					svg: { // will add and overide the the default xmlns="http://www.w3.org/2000/svg" attribute to the resulting SVG
						viewBox : '0 0 24 24',
						xmlns: 'http://www.w3.org/2000/svg'
					},

					cleanup : ['style', 'fill', 'id'],

					includedemo : grunt.file.read( 'sources/demo/template.html' )

				},
				files: {
					'svg-sprite/social-logos.svg': ['svg-min/*.svg']
				}
			}
		},

		rename: {
			moveThis: {
					src: 'svg-sprite/social-logos-demo.html',
					dest: 'svg-sprite/index.html'
			}
		},

		copy: {
			main: {
				src: 'svg-sprite/index.html',
				dest: 'docs/index.html'
			},
			sprite: {
				src: 'svg-sprite/social-logos.svg',
				dest: 'docs/social-logos.svg'
			}
		},

		webfont: {
			icons: {
				src: 'svg-min/*.svg',
				dest: 'icon-font'
			},
			options: {
				'engine': 'node',
				'autoHint': false,
				'normalize': true,
				'optimize': false,
				'font': 'social-logos',
				'types': 'eot,woff2,woff,ttf',
				'order': 'eot,woff,ttf',
				'embed': true,
				'descent': 0,
				'htmlDemoTemplate': 'sources/icon-font/demo-template.html',
				templateOptions: {
					baseClass: 'social-logo',
					classPrefix: 'social-logo-',
					mixinPrefix: 'social-logo-'
				},
				codepointsFile: 'codepoints.json'
			}
		},

		babel: {
			options: {
				sourceMap: false,
				presets: [
					'@babel/preset-env',
					'@babel/preset-react',
					'minify'
				],
				comments: false,
			},
			dist: {
				files: {
					"react/index.js": "react/index.jsx",
					"react/example.js": "react/example.jsx"
				}
			}
		},

    'svg-transform-add-g': {
      dist: {
        files: [{
          cwd: 'svg-min/',
          src: [ '**/*.svg' ],
          filter: 'isFile'
        }]
      }
    },

    'svg-to-php': {
      dist: {
        files: [{
          cwd: 'svg-min/',
          src: [ '**/*.svg' ],
          filter: 'isFile',
          dest: 'php/social-logos.php'
        }]
      }
    },

    'svg-transform-to-camelcase': {
      dist: {
        files: [{
          cwd: 'svg-min/',
          src: [ '**/*.svg' ],
          filter: 'isFile',
          dest: 'svg-min-react/'
        }]
      }
    },

    'svg-to-react': {
      dist: {
        files: [{
          cwd: 'svg-min-react/',
          src: [ '**/*.svg' ],
          filter: 'isFile',
          dest: 'react/'
        }]
      }
    },

    'svg-transform-add-square': {
      dist: {
        files: [{
          cwd: 'svg-min/',
          src: [ '**/*.svg' ],
          filter: 'isFile'
        }]
      }
    },

    'svg-to-pdf': {
      dist: {
        files: [{
          cwd: 'svg-min/',
          src: [ '**/*.svg' ],
          filter: 'isFile',
          dest: 'pdf/'
        }]
      }
    }
	});

  // ****************************************************************************************************
	// Default task
	grunt.registerTask('default', [
    'svgmin',
    'svg-transform-add-g',
    'svgstore',
    'rename',
    'copy',
    'svg-to-php',
    'svg-transform-to-camelcase',
    'svg-to-react',
    'babel',
    'svg-transform-add-square',
    'svg-to-pdf',
    'webfont',
    'clean'
  ]);
};
