
const gulp = require('gulp'),
    zip = require('gulp-zip'),
    upload = require('webstore-upload'),
    watch = require('gulp-chokidar')(gulp),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    rename = require('gulp-rename'),
    es = require('event-stream'),
    clean = require('gulp-clean');

const appId = 'phmpdjdaaenhgojfhacckdjpomnopkoh';

// Build scripts
gulp.task('build', () => {
    const entries = [
        './src/all-frames.js',
        './src/root.js',
        './src/background.js'
    ];

    var tasks = entries.map(entry =>
        browserify({
            entries: entry,
            transform: [[babelify, { presets: ["es2015"] }]]
        })
            .bundle()
            .pipe(source(entry))
            .pipe(rename({
                dirname: './'
            }))
            .pipe(gulp.dest('./dist'))
    );

    return es.merge.apply(null, tasks);
});

// Copy static files
gulp.task('copy', () => 
    gulp.src([
        './src/options/*',
        './src/manifest.json',
        './src/styles.css',
        './src/icons/*'
    ])
        .pipe(gulp.dest('dist'))
);

gulp.task('clean', () =>
    gulp.src('./dist/*', { read: false })
        .pipe(clean())
);

gulp.task('zip-files', ['build', 'copy'], () =>
    gulp.src('dist/*')
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest('dist'))
);

gulp.task('store-publish', ['zip-files'], callback => {
    const credentials = require('./credentials.json'),
    options = {
        accounts:{
            default:{
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                refresh_token: credentials.refreshToken
            }
        },
        extensions:{
            unit4: {
                appID: appId,
                zip: "dist/archive.zip",
                publish: true
            }
        },
        uploadExtensions: ['unit4']
    };

    upload(options, 'default')
        .then(result => console.log(result))
        .catch(error => console.error(error));
});

gulp.task('default', ['build', 'copy'], function() {
    watch(['src/**/*', '!src/*.bundle.js'], ['build', 'copy']);
});
gulp.task('publish', ['clean', 'build', 'copy', 'zip-files', 'store-publish']);

