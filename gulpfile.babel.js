'use strict';

import autoprefixer from 'gulp-autoprefixer';
import browserSync from 'browser-sync'
import bump from 'gulp-bump';
import clean from 'gulp-clean';
import concat from 'gulp-concat';
import eslint from 'gulp-eslint'
import gulp from 'gulp';
import rename from 'gulp-rename';
import scss from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import webpack from 'webpack-stream';

/**
 * Config files
 */
import config from './cfg/gulp.config.js';
import bundles from './cfg/gulp.bundle.js';
import webpackConfig from './cfg/webpack.config.js';

/**
 * Browsersync
 */
gulp.task('browser-sync', () => {
    browserSync.create();
    browserSync.init(config.browserSync);
});

/**
 * Handle ES6 modules
 */
gulp.task('scripts:main', () => {
    return gulp.src(config.paths.scripts.source)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(config.paths.scripts.dest));
})

/**
 * Handle SCSS
 */
gulp.task('styles:main', () => {
	return gulp.src(config.paths.styles.source)
	    .pipe(sourcemaps.init({ loadMaps: true }))
    	.pipe(scss(config.styles))
        .on('error', scss.logError)
        .pipe(rename('style.min.css'))
    	.pipe(autoprefixer(config.autoprefixer))
        .pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(config.paths.styles.dest))
        .pipe(browserSync.stream({match: '**/*.css'}));
});

/**
 * Handle any 3rd party CSS
 */
gulp.task('styles:vendor', () => {
    return gulp.src(bundles.vendor.styles)
    .pipe(concat('vendor.bundle.min.css'))
    .pipe(gulp.dest(config.paths.styles.dest));
});

/**
 * Currently no templating used but this is
 * where it would be applied
 */
gulp.task('html', () => {
	return gulp.src('src/index.html')
		.pipe(gulp.dest('dist/'));
});

gulp.task('img', () => {
    return gulp.src(config.paths.images.source)
        .pipe(gulp.dest(config.paths.images.dest));
});


gulp.task('fonts', () => {
    return gulp.src(config.paths.fonts.source)
        .pipe(gulp.dest(config.paths.fonts.dest));
});

/**
 * Clean the dist dir
 */
gulp.task('clean:build', () => {
    gulp.src(config.clean.build, { read: false})
    .pipe(clean());
});

gulp.task('watch', () => {
	gulp.watch('src/*', ['html']);
	gulp.watch(gulp.config.paths.styles.watch, ['scss']);
	gulp.watch('src/js/**/*.js', ['js', 'test']);
});

// Default task
// ========================================================================================

gulp.task('default', ['build', 'browser-sync'], () => {
    gulp.watch(config.paths.scripts.watch, ['scripts:main']);
    gulp.watch(config.paths.styles.watch, ['styles:main']);
    gulp.watch(config.paths.markup.watch, ['html']);
});

gulp.task('build', ['scripts:main', 'styles:main', 'styles:vendor', 'html', 'img', 'fonts']);

// Utilities
// ========================================================================================

gulp.task('patch-bump', () => {
    var stuff = gulp.src('./package.json')
        .pipe(bump({type:'patch'}))
        .pipe(gulp.dest('./'))
    return stuff;
});
