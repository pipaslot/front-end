module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            jsAll: {
                src: ['src/pipas.js',
                    'src/pipas/overlay.js',
                    'src/pipas/spinner.js', //require: overlay
                    'src/pipas/progress.js',//require: overlay
                    'src/pipas/message.js', //require: overlay
                    'src/pipas/upload.js',  //require: progress
                    'src/pipas/modal.js',   //require: spinner, message
                    'src/pipas/bower.js',
                    'src/pipas/url.js',
                    'src/pipas/utils.js',
                    'src/nette-extension/*.js',
                    'src/nette-init.js'],
                dest: 'dist/front-end.js'
            },
            cssAll: {
                src: ['src/nette-extension/*.css', 'src/pipas/*.css'],
                dest: 'dist/front-end.css'
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