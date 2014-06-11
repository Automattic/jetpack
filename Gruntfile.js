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
		cssjanus: {
			core: {
				options: { 
					swapLtrRtlInUrl: false 
				},
				expand: true,
				ext: '-rtl.css', 
				src: ['_inc/*.css','!_inc/*-rtl.css','!_inc/*.min.css'  ]
			},
			min: {
				options: { 
					swapLtrRtlInUrl: false 
				},
				expand: true,
				ext: '-rtl.min.css', 
				src: ['_inc/*.min.css','!_inc/*-rtl.min.css' ]
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
					cwd: '_inc',
					src: ['*.scss'],
					dest: '_inc',
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
					cwd: '_inc',
					src: ['*.scss'],
					dest: '_inc',
					ext: '.min.css'
				}]
			}
		},
		autoprefixer: {
			options: {
				map: true
			},
			global: {
			options: {
				// Target-specific options go here.
				// browser-specific info: https://github.com/ai/autoprefixer#browsers
				// DEFAULT: browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1']
				browsers: ['> 1%', 'last 2 versions', 'ff 17', 'opera 12.1', 'ie 8', 'ie 9']
			},
				src: '_inc/*.css'
			},
		},
		watch: {
			sass: {
				files: [
					'_inc/*.scss',
					'_inc/**/*.scss'
				],
				tasks: ['sass', 'autoprefixer' ],
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
