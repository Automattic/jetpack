
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
				'*/*.php',
				'*/*/*.php',
				'*/*/*/*.php',
				'*/*/*/*/*.php',
				'*/*/*/*/*/*.php',
			]
		}
	};

	grunt.initConfig( cfg );

	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks("grunt-phplint");

	grunt.registerTask('default', ['shell']);
	grunt.registerTask('default', ['phplint']);

};
