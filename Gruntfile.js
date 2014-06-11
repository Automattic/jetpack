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
			buildSass: {
				command: 'php tools/pre-commit-build-scss.php'
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
		watch: {
			sass: {
				files: [
					'_inc/*.scss',
					'_inc/**/*.scss'
				],
				tasks: ['sass', 'autoprefixer', 'cssjanus:core', 'cssjanus:min' ],
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
