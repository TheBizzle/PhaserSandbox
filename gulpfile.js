var gulp       = require('gulp');
var ts         = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var merge      = require('merge2');

var tsProject =
  ts.createProject({
    'declaration':   true
  , 'module':        'commonjs'
  , 'noImplicitAny': true
  , 'target':        'ES6'
  });

gulp.task('scripts', function() {

  var srcs = gulp.src('src/*.ts');

  var phaserTypeDefs = gulp.src('../v2/typescript/phaser.d.ts');

  var tsResult = merge(srcs, phaserTypeDefs).pipe(sourcemaps.init()).pipe(tsProject());

  var tsDefs = tsResult.dts.pipe(gulp.dest('release/definitions'));

  var tsJS =
    tsResult.js.pipe(sourcemaps.write())
               .pipe(gulp.dest('release/js'));

  return merge([tsDefs, tsJS]);

});

gulp.task('watch', ['scripts'], function() { gulp.watch('src/*.ts', ['scripts']); });