module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            jsUrl: {
                src: ['src/pipas.js', 'src/pipas/*.js'],
                dest: 'dist/pipas.js'
            },
            jsNetteExtensions: {
                src: ['src/nette-extension/*.js'],
                dest: 'dist/nette-extensions.js'
            },
            jsNetteInit: {
                src: ['src/nette-init.js'],
                dest: 'dist/nette-init.js'
            },
            cssNette: {
                src: 'src/nette-extension/*.css',
                dest: 'dist/nette.css'
            },
            cssPipas: {
                src: 'src/pipas/*.css',
                dest: 'dist/pipas.css'
            }
        },
        uglify: {
            allJs: {
                files: [{
                    expand: true,
                    src: ['**/*.js', '!**/*.min.js'],
                    cwd: 'dist',
                    dest: 'dist',
                    ext: '.min.js'
                }]
            }
        },
        cssmin: {
            allCss: {
                files: [{
                    expand: true,
                    src: ['**/*.css', '!**/*.min.css'],
                    cwd: 'dist',
                    dest: 'dist',
                    ext: '.min.css'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('default', ['concat', 'uglify', 'cssmin']); // Default grunt tasks maps to grunt
};