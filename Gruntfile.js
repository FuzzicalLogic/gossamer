module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'build-atom-shell': {
            config: 'Debug',
            tag: 'v0.28.3',
            nodeVersion: '0.22.0',
            buildDir: (process.env.TMPDIR || process.env.TEMP || '/tmp') + '/electron',
            projectName: 'denide',
            productName: 'De-Nide',
            targetDir: '/denide'
        }
    });

    grunt.loadNpmTasks('grunt-build-atom-shell');
    grunt.registerTask('default', ['build-atom-shell']);
}
