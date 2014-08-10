/* global module */

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
		concat: {
			options: {
				// banner: '/*!\n'+
				// 		'* Do not modify this file directly.  It is concatenated from individual module CSS.\n'+
				// 		'*/'
			},
			modules: {
				src: [
					'modules/carousel/jetpack-carousel.css',
					'modules/carousel/jetpack-carousel-ie8fix.css',
					'modules/contact-form/css/grunion.css',
					'modules/gplus-authorship/style.css',
					'modules/infinite-scroll/infinity.css',
					'modules/likes/style.css',
					// 'modules/markdown/easy-markdown.css', // Don't think it's used
					// 'modules/post-by-email/post-by-email.css', // TODO: Inline this sucker
					'modules/related-posts/related-posts.css',
					'modules/sharedaddy/sharing.css',
					'modules/shortcodes/css/slideshow-shortcode.css',
					'modules/shortcodes/css/style.css',
					'modules/subscriptions/subscriptions.css',
					'modules/tiled-gallery/tiled-gallery.css',
					'modules/widget-visibility/widget-conditions/widget-conditions.css',
					'modules/widgets/wordpress-post-widget/style.css',
					'modules/widgets/gravatar-profile.css',
					'modules/widgets/widget-grid-and-list.css',
					'modules/widgets/widgets.css', // Moved to image-widget/style.css
				],
				dest: "css/jetpack.css"
			},
		},
		cssmin: {
			options: {
			},
			modules: {
				options: {
					banner: '/*!\n'+
							'* Do not modify this file directly.  It is concatenated from individual module CSS files.\n'+
							'*/'
				},
				src: [
					'css/jetpack.css'
				],
				dest: "css/jetpack.css"
			},
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
					'!css/*-rtl.css',
					'!css/*.min.css',
					'!css/jetpack.css',
					'!css/jetpack-rtl.css',
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
					'!css/*-rtl.min.css',
					'!css/jetpack.css',
					'!css/jetpack-rtl.css',
				]
			},
			modules: {
				options: {
					swapLtrRtlInUrl: false
				},
				expand: true,
				ext: '-rtl.css',
				src: [
					'css/jetpack.css',
					'!css/jetpack-rtl.css'
				]
			}
		},
		jshint: {
			options: grunt.file.readJSON('.jshintrc'),
			src: [
				'_inc/*.js',
				'modules/*.js',
				'modules/**/*.js'
			]
		},
		sass: {
			expanded: {
				options: {
					style: 'expanded',
					banner: '/*!\n'+
							'* Do not modify this file directly.  It is compiled Sass code.\n'+
							'* @see: jetpack/_inc/jetpack.scss\n'+
							'*/'
				},
				files: [{
					expand: true,
					cwd: 'scss',
					src: ['*.scss'],
					dest: 'css',
					ext: '.css'
				}]
			},
			minified: {
				options: {
					style: 'compressed',
					sourcemap: true
				},
				files: [{
					expand: true,
					cwd: 'scss',
					src: ['*.scss'],
					dest: 'css',
					ext: '.min.css'
				}]
			}
		},
		autoprefixer: {
			options: {
				// map: true
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
					'!css/jetpack.css',
					'!css/jetpack-rtl.css',
				],
			},
			modules: {
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
					'cssjanus:min',
					'notify:watch_sass'
					'cssjanus:coreMin'
				],
				options: {
					spawn: false
				}
			},
			css: { // concatenates modules CSS into css/jetpack.css
				files: [
					'modules/**/*.css',
				],
				tasks: [
					'concat:modules',
					'autoprefixer:modules',
					'cssmin:modules',
					'cssjanus:modules',
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
				tasks: ['phplint'],
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
				tasks: ['jshint'],
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
					mainFile: 'jetpack.php',
					potFilename: 'jetpack.pot',
					i18nToolsPath: path.join( __dirname , '/tools/' )
				}
			}
		},
		addtextdomain: {
			jetpack: {
				options: {
					textdomain: 'jetpack',
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
		'shell',
		'phplint',
		'jshint'
	]);

	grunt.registerTask('rtl', [
		'cssjanus:core',
		'cssjanus:min',
	]);

};
