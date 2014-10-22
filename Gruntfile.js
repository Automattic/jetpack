/* global module, require */


/* Replace relative paths with new paths */
function transformRelativePath( relPath, filepath ) {
	// If wrapped in singly quotes, strip them
	if ( 0 === relPath.indexOf( '\'' ) ) {
		relPath = relPath.substr( 1, relPath.length - 2 );
	}

	// Return the path unmodified if not relative
	if ( ! ( 0 === relPath.indexOf( './' ) || 0 === relPath.indexOf( '../' ) ) ) {
		return relPath;
	}

	// The concat file is in jetpack/css/jetpack.css, so to get to the root we
	// have to go back one dir
	var relPieces = relPath.split( '/' ),
		filePieces = filepath.split( '/' );

	filePieces.pop(); // Pop the css file name

	if ( '.' === relPieces[0] ) {
		relPieces.shift();
	}

	while ( '..' === relPieces[0] ) {
		relPieces.shift();
		filePieces.pop();
	}

	return '../' + filePieces.join( '/' ) + '/' + relPieces.join( '/' );
}

/* Admin CSS to be minified, autoprefixed, rtl */
var admincss = [
	'modules/after-the-deadline/atd',
	'modules/after-the-deadline/tinymce/css/content',
	'modules/contact-form/css/menu-alter',
	'modules/custom-css/csstidy/cssparse',
	'modules/custom-css/csstidy/cssparsed',
	'modules/custom-css/custom-css/css/codemirror',
	'modules/custom-css/custom-css/css/css-editor',
	'modules/custom-css/custom-css/css/use-codemirror',
	'modules/omnisearch/omnisearch',
	'modules/omnisearch/omnisearch-jetpack',
	'modules/post-by-email/post-by-email',
	'modules/publicize/assets/publicize',
	'modules/sharedaddy/admin-sharing',
	'modules/videopress/videopress-admin',
	'modules/widget-visibility/widget-conditions/widget-conditions',
	'modules/widgets/gallery/css/admin'
];

/* Front-end CSS to be concatenated */
var frontendcss = [
	'modules/carousel/jetpack-carousel.css',
	'modules/contact-form/css/grunion.css',
	'modules/infinite-scroll/infinity.css',
	'modules/likes/style.css',
	'modules/related-posts/related-posts.css',
	'modules/sharedaddy/sharing.css',
	'modules/shortcodes/css/slideshow-shortcode.css',
	'modules/shortcodes/css/style.css', // TODO: Should be renamed to shortcode-presentations
	'modules/subscriptions/subscriptions.css',
	'modules/tiled-gallery/tiled-gallery/tiled-gallery.css',
	'modules/widgets/wordpress-post-widget/style.css',
	'modules/widgets/gravatar-profile.css',
	'modules/widgets/widget-grid-and-list.css',
	'modules/widgets/widgets.css' // TODO Moved to image-widget/style.css
];

module.exports = function(grunt) {
	var path = require( 'path' ),
		cfg = {
		pkg: grunt.file.readJSON('package.json'),
		shell: {
			checkHooks: {
				command: 'diff --brief .git/hooks/pre-commit tools/git-hooks/pre-commit',
				options: {
					stdout: true
				}
			},
			buildModuleHeadingsTranslations: {
				command: 'php tools/build-module-headings-translations.php',
				options: {
					stdout: true
				}
			}
		},
		notify: {
			watch_sass: {
				options: {
					title: 'Compilation done!',
					message: 'Sass, Autoprefixer, and Janus have finished running.'
				}
			}
		},
		phplint: {
			files: [
				'*.php',
				'_inc/*.php',
				'_inc/**/*.php',
				'modules/*.php',
				'modules/**/*.php',
				'views/**/*.php',
				'3rd-party/*.php'
			]
		},
		autoprefixer: {
			options: {
			},
			core: {
				options: {
					// Target-specific options go here.
					// browser-specific info: https://github.com/ai/autoprefixer#browsers
					// DEFAULT: browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1']
					map: true,
					browsers: [
						'> 1%',
						'last 2 versions',
						'ff 17',
						'opera 12.1',
						'ie 8',
						'ie 9'
					]
				},
				src: [
					'css/*.css',
					'!css/*-rtl.min.css',
					'!css/*-rtl*.css',
					'!css/jetpack.css',
					'!css/jetpack-rtl.css'
				]
			},
			frontEndModules: {
				options: {
					// Target-specific options go here.
					// browser-specific info: https://github.com/ai/autoprefixer#browsers
					// DEFAULT: browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1']
					browsers: [
						'> 1%',
						'last 2 versions',
						'ff 17',
						'opera 12.1',
						'ie 8',
						'ie 9'
					]
				},
				src: 'css/jetpack.css'
			},
			adminModules: {
				options: {
					// Target-specific options go here.
					// browser-specific info: https://github.com/ai/autoprefixer#browsers
					// DEFAULT: browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1']
					browsers: [
						'> 1%',
						'last 2 versions',
						'ff 17',
						'opera 12.1',
						'ie 8',
						'ie 9'
					]
				},
				src: admincss.map( function( file ) { return file + '.min.css'; } )
			}
		},
		concat: {
			options: {
				process: function( src, filepath ) {
					var regex = /url\((.*)\)/g;
					return src.replace( regex, function( match, group ) {
						return 'url(\'' + transformRelativePath( group, filepath ) + '\')';
					});
				}
			},
			frontEndModules: {
				src: frontendcss.map( function( file ) { return file; } ),
				dest: 'css/jetpack.css'
			}
		},
		cssmin: {
			options: {
			},
			frontEndModules: {
				options: {
					banner: '/*!\n'+
							'* Do not modify this file directly.  It is concatenated from individual module CSS files.\n'+
							'*/'
				},
				src: [
					'css/jetpack.css'
				],
				dest: 'css/jetpack.css'
			},
			adminModules: {
				options: {},
				expand: true,
				ext: '.min.css',
				src: admincss.map( function( file ) { return file + '.css'; } )
			}
		},
		cssjanus: {
			core: {
				options: {
					swapLtrRtlInUrl: false
				},
				expand: true,
				ext: '-rtl.css',
				src: [
					'css/*.css',
					'!css/*-rtl*.css',
					'!css/jetpack.css',
					'!css/jetpack-rtl.css'
				]
			},
			coreMin: {
				options: {
					swapLtrRtlInUrl: false
				},
				expand: true,
				ext: '-rtl.min.css',
				src: [
					'css/*.min.css',
					'!css/*-rtl*.css',
					'!css/jetpack.css',
					'!css/jetpack-rtl.css'
				]
			},
			frontEndModules: {
				options: {
					swapLtrRtlInUrl: false
				},
				expand: true,
				ext: '-rtl.css',
				src: [
					'css/jetpack.css',
					'modules/theme-tools/compat/*.css',
					'modules/infinite-scroll/themes/twentyfifteen.css',
					'!css/jetpack-rtl.css',
					'!modules/theme-tools/compat/*-rtl.css',
					'!modules/infinite-scroll/themes/twentyfifteen-rtl.css'
				]
			},
			adminModules: {
				options: {
					swapLtrRtlInUrl: false
				},
				expand: true,
				ext: '-rtl.min.css',
				src: admincss.map( function( file ) { return file + '.min.css'; } )
			},
			adminModulesExpanded: {
				options: {
					swapLtrRtlInUrl: false
				},
				expand: true,
				ext: '-rtl.css',
				src: admincss.map( function( file ) { return file + '.css'; } )
			}
		},
		jshint: {
			options: grunt.file.readJSON('.jshintrc'),
			src: [
				'_inc/*.js',
				'modules/*.js',
				'modules/**/*.js',
				'!_inc/*.min.js',
				'!modules/*.min.',
				'!modules/**/*.min.js'
			]
		},
		sass: {
			expanded: {
				options: {
					style:  'expanded',
					banner: '/*!\n'+
							'* Do not modify this file directly.  It is compiled Sass code.\n'+
							'* @see: jetpack/_inc/jetpack.scss\n'+
							'*/'
				},
				files: [{
					expand: true,
					cwd:    'scss',
					src: [
						'*.scss'
					],
					dest:   'css',
					ext:    '.css'
				}]
			},
			minified: {
				options: {
					style:     'compressed',
					sourcemap: true
				},
				files: [{
					expand: true,
					cwd:    'scss',
					src: [
						'*.scss'
					],
					dest:   'css',
					ext:    '.min.css'
				}]
			}
		},
		watch: {
			sass: {
				files: [
					'scss/*.scss',
					'scss/**/*.scss'
				],
				tasks: [
					'sass',
					'autoprefixer:core',
					'cssjanus:core',
					'notify:watch_sass',
					'cssjanus:coreMin'
				],
				options: {
					spawn: false
				}
			},
			css: { // concatenates modules CSS into css/jetpack.css
				files: [
					'modules/**/*.css'
				],
				tasks: [
					// Front-end module css (jetpack.css)
					'concat:frontEndModules',
					'autoprefixer:frontEndModules',
					'cssmin:frontEndModules',
					'cssjanus:frontEndModules',

					// Admin module css
					'cssmin:adminModules',
					'autoprefixer:adminModules',
					'cssjanus:adminModules',
					'cssjanus:adminModulesExpanded'
				],
				options: {
					spawn: false
				}
			},
			php: {
				files: [
					'*.php',
					'_inc/*.php',
					'_inc/**/*.php',
					'modules/*.php',
					'modules/**/*.php',
					'views/**/*.php',
					'3rd-party/*.php'
				],
				tasks: [
					'phplint',
					'shell:buildModuleHeadingsTranslations'
				],
				options: {
					spawn: false
				}
			},
			js: {
				files: [
					'_inc/*.js',
					'modules/*.js',
					'modules/**/*.js'
				],
				tasks: [
					'jshint'
				],
				options: {
					spawn: false
				}
			}
		},
		makepot: {
			jetpack: {
				options: {
					domainPath: '/languages',
					exclude: [
						'node_modules',
						'tests',
						'tools'
					],
					mainFile:    'jetpack.php',
					potFilename: 'jetpack.pot'
				}
			}
		},
		addtextdomain: {
			jetpack: {
				options: {
					textdomain: 'jetpack'
				},
				files: {
					src: [
						'*.php',
						'**/*.php',
						'!node_modules/**',
						'!tests/**',
						'!tools/**'
					]
				}
			}
		}
	};

	grunt.initConfig( cfg );

	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-phplint');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-wp-i18n');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-cssjanus');
	grunt.loadNpmTasks('grunt-notify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', [
		// CSS
		'sass',
		'concat',
		'autoprefixer',
		'cssmin',
		'cssjanus',

		// Precommit stuff
		'shell',
		'phplint',
		'jshint',

		// Starts watch
		'watch'
	]);

	grunt.registerTask('precommit', [
		// CSS
		'sass',
		'concat',
		'autoprefixer',
		'cssmin',
		'cssjanus',

		// Precommit stuff
		'shell',
		'phplint',
		'jshint'
	]);
};
