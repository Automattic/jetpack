
module.exports = function(grunt) {

	var cfg = {
		pkg: grunt.file.readJSON('package.json'),
		shell: {
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
				'views/**/*.php',
				'3rd-party/*.php'
			]
		}
	};

	grunt.initConfig( cfg );

	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-phplint');

	grunt.registerTask('default', [
		'shell',
		'phplint'
	]);

};
