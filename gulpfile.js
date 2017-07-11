var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
//var jade = require('gulp-jade');
//var sass = require('gulp-sass');
//var plumber = require('gulp-plumber');
var autoprefixer = require('autoprefixer');
var mainbowerfiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
//var postcss = require('gulp-postcss');
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');
var envOptions = {
    string: 'env',
    default: {
        env: 'develop'
    }
}
var option = minimist(process.argv.slice(2), envOptions)
console.log(option)

gulp.task('clean', function() {
    return gulp.src(['./.tmp', './public'], { read: false })
        .pipe($.clean());
});

gulp.task('copyhtml', function() {
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('/public/'))
});

gulp.task('jade', function() {
    //var YOUR_LOCALS = {};

    gulp.src('./source/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            //locals: YOUR_LOCALS
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
});

gulp.task('sass', function() {
    var plugins = [
        autoprefixer({ browsers: ['last 2 version', 'ie 8'] })
    ];
    gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //css編譯完成
        .pipe($.postcss(plugins))
        .pipe($.if(option.env == 'production', $.minifyCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream());
});
gulp.task('babel', () => {
    return gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(option.env == 'production', $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
});

gulp.task('bower', function() {
    return gulp.src(mainbowerfiles({
            "overrides": {
                "vue": {
                    "main": "dist/vue.js"
                }
            }
        }))
        .pipe(gulp.dest('./.tmp/vendors'));
});
gulp.task('vendorjs', ['bower'], function() {
    return gulp.src('./.tmp/vendors/**/**.js')
        .pipe($.order(['jquery.js',
            'bootstrap.js'
        ]))
        .pipe($.concat('vendors.js'))
        .pipe($.if(option.env == 'production', $.uglify()))
        .pipe(gulp.dest('./public/js'))

});
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

gulp.task('image-min', () =>
    gulp.src('./source/images/*')
    .pipe($.if(option.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'))
);
gulp.task('watch', function() {
    gulp.watch('./source/scss/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/js/**/*.js', ['babel']);
    gulp.watch('./source/images/**/', ['image-min']);
});

gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorjs', 'image-min'));

gulp.task('default', ['jade', 'sass', 'babel', 'vendorjs', 'browser-sync', 'image-min', 'watch']);