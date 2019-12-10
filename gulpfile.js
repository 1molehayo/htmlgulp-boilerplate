var gulp = require('gulp');
var htmlclean = require('gulp-htmlclean');
var imagemin = require('gulp-imagemin');
var newer = require('gulp-newer');
var noop = require('gulp-noop');

// var concat = require('gulp-concat');
// var deporder = require('gulp-deporder');
// var terser = require('gulp-terser');
// var stripdebug = devBuild ? null : require('gulp-strip-debug');

var sourcemaps = devBuild ? require('gulp-sourcemaps') : null;
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var assets = require('postcss-assets');
var autoprefixer = require('autoprefixer');
var mqpacker = require('css-mqpacker');
var cssnano = require('cssnano');
var browserSync = require('browser-sync').create();

const rollup = require('gulp-better-rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

// development mode?
var devBuild = process.env.NODE_ENV !== 'production';
var src = 'src/';
var build = 'dist/';

// image processing
function images() {
  const out = build + 'assets/images/';

  return gulp
    .src(src + 'assets/images/**/*')
    .pipe(newer(out))
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest(out));
}
exports.images = images;

// HTML processing
function html() {
  return gulp
    .src(src + '**/*.html')
    .pipe(newer(build))
    .pipe(devBuild ? noop() : htmlclean())
    .pipe(gulp.dest(build));
}
exports.html = gulp.series(images, html);

// JavaScript processing
// function js() {
//   const out = build + 'assets/js/';
//   return gulp
//     .src(src + 'assets/js/**/*')
//     .pipe(sourcemaps ? sourcemaps.init() : noop())
//     .pipe(deporder())
//     .pipe(concat('main.js'))
//     .pipe(stripdebug ? stripdebug() : noop())
//     .pipe(terser())
//     .pipe(sourcemaps ? sourcemaps.write() : noop())
//     .pipe(gulp.dest(out));
// }
function js() {
  const out = build + 'assets/js/';
  return gulp
    .src(src + 'assets/js/**/*')
    .pipe(sourcemaps ? sourcemaps.init() : noop())
    .pipe(rollup({ plugins: [babel(), resolve(), commonjs()] }, 'umd'))
    .pipe(sourcemaps ? sourcemaps.write() : noop())
    .pipe(gulp.dest(out));
}
exports.js = js;

// CSS processing
function css() {
  const out = build + 'assets/css/';
  return gulp
    .src(src + 'assets/sass/main.scss')
    .pipe(sourcemaps ? sourcemaps.init() : noop())
    .pipe(
      sass({
        outputStyle: 'nested',
        imagePath: '/assets/images/',
        precision: 3,
        errLogToConsole: true
      }).on('error', sass.logError)
    )
    .pipe(
      postcss([
        assets({ loadPaths: ['assets/images/'] }),
        autoprefixer(),
        mqpacker,
        cssnano
      ])
    )
    .pipe(sourcemaps ? sourcemaps.write() : noop())
    .pipe(gulp.dest(out));
}
exports.css = gulp.series(images, css);

// Fonts
function fonts() {
  const out = build + 'assets/fonts/';
  return gulp.src(src + 'assets/fonts/**/*').pipe(gulp.dest(out));
}
exports.fonts = fonts;

exports.build = gulp.parallel(
  exports.html,
  exports.fonts,
  exports.css,
  exports.js
);

// watch for file changes
function watch(done) {
  browserSync.init({
    port: 8080,
    server: build
  });

  var reload = browserSync.reload;

  // image changes
  gulp.watch(src + 'assets/images/**/*', images).on('change', reload);

  // html changes
  gulp.watch(src + '**/*.html', html).on('change', reload);

  // css changes
  gulp.watch(src + 'assets/sass/**/*', css).on('change', reload);

  // js changes
  gulp.watch(src + 'assets/js/**/*', js).on('change', reload);

  done();
}
exports.watch = watch;

exports.default = gulp.series(exports.build, exports.watch);
