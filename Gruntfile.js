'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-haml');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.initConfig({
        haml: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '.',
                    src: ['*.haml'],
                    dest: '.',
                    ext: '.html'
                }]
            }
        },
        sass: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'css',
                    src: ['*.scss'],
                    dest: 'css',
                    ext: '.css'
                }]
            }
        },
        browserify: {
          app: {
            src: 'js/main.js',
            dest: 'js/app.js',
            options: {
              watch: true,
              browserifyOptions: {
                 debug: true
              }
            }
          }
        },
        watch: {
            haml: {
                files: ['**/*.haml'],
                tasks: ['haml']
            },
            sass: {
                files: ['**/*.scss'],
                tasks: ['sass']
            }
        }
    });

    grunt.registerTask('default', ['browserify', 'watch']);
};
