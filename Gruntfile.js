module.exports = function (grunt) {


    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'app/*.js', 'app/**/*.js']
        },
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            unit: {
                singleRun: true
            },
            continuous: {
                singleRun: false,
                autoWatch: true
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/module.js', 'src/katexHtmlRenderer.js', 'src/pagedownKatex.js'],
                dest: 'tmp/pagedownKatex.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/pagedownKatex.min.js': ['tmp/pagedownKatex.js'],
                },
                options: {
                    mangle: false
                }
            }
        },
        cssmin: {
            target: {
                files: {
                    'dist/pagedownKatex.min.css': ['src/*.css']
                }
            }
        },
        copy: {
            button: {
                expand: true,
                cwd: 'bower_components/pagedown/',
                src: 'wmd-buttons.png',
                dest: 'pagedown/'
            }
        },
        clean: {
            dist: {
                src: ['dist']
            },
            temp: {
                src: ['tmp']
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'concat',
        'uglify',
        'cssmin',
        'copy',
        'clean:temp',
    ]);

    grunt.registerTask('karma-build', [
        'clean:dist',
        'concat',
        'uglify',
        'cssmin',
        'copy',
        'clean:temp',
        'karma'
    ]);
};