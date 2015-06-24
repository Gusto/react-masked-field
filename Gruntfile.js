module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-haml');
    grunt.loadNpmTasks('grunt-contrib-watch');

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

    grunt.registerTask('default', ['watch']);
};
