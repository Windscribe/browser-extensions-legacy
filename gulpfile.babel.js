'use strict';

import gulp from 'gulp';
import del from 'del';
import yargs from 'yargs';
import webpackStream from 'webpack-stream';
import runSequence from 'run-sequence';
import uglify from 'gulp-uglify';
import pump from 'pump';
import stripDebug from 'gulp-strip-debug';
import changed from 'gulp-changed';
import webpackConfig from './webpack.config';
import webpack from 'webpack';

let target = yargs.argv.target || 'chrome';
let mode = yargs.argv.mode || 'development'

const DEST = `dist/${target}-webextension`;

const definePlugin = new webpack.DefinePlugin({
    'process.env': {
        'NODE_ENV': JSON.stringify('production')
    },
    'ENV': JSON.stringify(`${target}`)
});

const plugins = [definePlugin]

console.log('process.target and mode', target, mode);

gulp.task('watch', () => gulp.watch(['common/scripts/**', 'common/css/**', `${target}/**`, 'common/js/**'], ['default']))

gulp.task('clean', () => del(['dist/**']));

gulp.task('clean-scripts', () => del([`${DEST}/scripts/**`]));

gulp.task('copy', () => gulp.src([`common/**`, `${target}/**`])
    .pipe(changed(DEST))
    .pipe(gulp.dest(DEST)));

gulp.task('build-backend', () => {
    const config = Object.assign({}, webpackConfig[mode], {
        output: {
            path: __dirname + `/${DEST}`,
            filename: "myBackground.js"
        },
        plugins
    });
    return gulp.src(`${DEST}/scripts/backgroundEntry.js`)
            .pipe(webpackStream(config))
            .pipe(gulp.dest(DEST))
    });

gulp.task('build-client', () => {
        const config = Object.assign({}, webpackConfig[mode], {
            output: {
                path: __dirname + `/${DEST}`,
                filename: "myExtension.js"
            },
            plugins
        });

        return gulp.src(`${DEST}/scripts/frontEndEntry.js`)
            .pipe(webpackStream(config))
            .pipe(gulp.dest(DEST))
    });

gulp.task('serve', () => {
    runSequence('clean', 'default', 'watch')
});

gulp.task('strip-debug', () => gulp.src(`${DEST}/*.js`)
    .pipe(stripDebug())
    .pipe(gulp.dest(DEST)))

gulp.task('uglify', () => pump([
    gulp.src(`${DEST}/*.js`),
    uglify(),
    gulp.dest(DEST)
]));

gulp.task('default', () => {
    if (mode === 'production') runSequence('clean', 'copy', 'build-client', 'build-backend', 'uglify',
        'clean-scripts', 'strip-debug');
    else runSequence('copy', 'build-client', 'build-backend');
});