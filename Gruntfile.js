/*global module:false*/
module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		clean: {
      css : ['_inc/**/*.min.css'],
      js  : ['_inc/**/*.min.js']
		},
		cssmin: {
			inc : {
				expand: true,
				ext: '.min.css',
				src: [
					'_inc/**/*.css',
          '!_inc/**/*.min.css'
				]
			}
		},
		uglify: {
			inc : {
				expand: true,
				ext: '.min.js',
				src: [
					'_inc/**/*.js',
          '!_inc/**/*.min.js'
				]
			},
		},
		watch: {
			js: {
				files: [
            '_inc/**/*.js',
            '!_inc/**/*.min.js'
				],
				tasks: ['clean:js', 'uglify:inc'],
				options: {
					dot      : false,
					spawn    : false,
					interval : 2000
				}
			},
      css: {
        files: [
          '_inc/**/*.css',
          '!_inc/**/*.min.css'
        ],
				tasks: ['clean:css', 'cssmin:inc'],
				options: {
					dot      : false,
					spawn    : false,
					interval : 2000
				}
      }
		}
	});

  // Load tasks
  require('matchdep').filterDev('grunt-*').forEach( grunt.loadNpmTasks );

	// Register tasks.
	grunt.registerTask('build', ['clean', 'cssmin:inc','uglify:inc']);

	// Default task.
	grunt.registerTask('default', ['build']);

};
