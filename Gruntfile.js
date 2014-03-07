
module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		shell: {
			buildSass: {
				command: 'php tools/pre-commit-build-scss.php'
			}
		}
	});

	grunt.loadNpmTasks('grunt-shell');

	grunt.registerTask('default', ['shell']);

};
