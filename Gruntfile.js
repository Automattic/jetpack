/* global module, require */

module.exports = function( grunt ) {
	const cfg = {
		pkg: grunt.file.readJSON( 'package.json' ),
		makepot: {
			jetpack: {
				options: {
					domainPath: '/languages',
					exclude: [
						'node_modules',
						'tests',
						'tools',
						'vendor'
					],
					mainFile: 'jetpack.php',
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
						'!tools/**',
						'!vendor/**'
					]
				}
			}
		}
	};

	grunt.initConfig( cfg );

	grunt.loadNpmTasks( 'grunt-wp-i18n' );
};
