const gulp = require('gulp');
const concat = require('gulp-concat-css');
const plumber = require('gulp-plumber');
const del = require('del');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mediaquery = require('postcss-combine-media-query');
const cssnano = require('cssnano');
const htmlMinify = require('html-minifier');
var jsdeps = require('gulp-js-deps');

function buildDeps(glob) {
  gutil.log(gutil.colors.green('Building dependency list for'), glob);
  return gulp
    .src(glob, { read: false })
    .pipe(jsdeps.build())
    .pipe(gulp.dest('dist/'));
}

// все HTML-файлы из папки src/ должны оказаться в папке dist/ с теми же именами и путями.
function html() {
  const options = {
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
    minifyCSS: true,
    keepClosingSlash: true,
  }; //Правила минификации html
  return gulp
    .src('src/**/*.html')
    .pipe(plumber())
    .on('data', function (file) {
      const buferFile = Buffer.from(
        htmlMinify.minify(file.contents.toString(), options)
      );
      return (file.contents = buferFile);
    })
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({ stream: true })); // говорим Gulp, откуда брать HTML-файлы
  // Во встроенном в Gulp методе src(), который умеет искать файлы, мы указали
  // путь до всех файлов с расширением HTML внутри папки src/.
  // Теперь применим к ним пайп (шаг) с методом Gulp dest().
  // Этот метод отвечает за отправку файла в точку
  // назначения (папку dist/).
  // Чтобы избежать ошибок при сборке, перед пайпом dest полезно разместить пайп plumber, чтобы в случае ошибок сборка не падала.
  //  .pipe(browserSync.reload({ stream: true }))  Этот пайп будет перезагружать страницу браузера при выполнении каждой задачи сборки.
  // Чтобы минификация html заработала, нужно добавить пайп в задачу сборки HTML через .on(...) после пламбера
}

function css() {
  const plugins = [autoprefixer(), mediaquery(), cssnano()];
  return gulp
    .src('src/**/*.css')
    .pipe(plumber())
    .pipe(concat('bundle.css'))
    .pipe(postcss(plugins))
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
  // говорим Gulp, откуда брать CSS-файлы
  //  Мы создали функцию, указали в методе src путь до всех CSS-файлов в папке styles/, потом вызвали plumber,
  // чтобы ничего не ломалось, потом использовали concat для склеивания CSS в один файл
  // с именем bundle.css и отправили результат в папку dist/.
  //  .pipe(browserSync.reload({ stream: true }))  Этот пайп будет перезагружать страницу браузера при выполнении каждой задачи сборки.
  //Чтобы PostCSS заработал, нужно встроить его в задачи сборщика. Так как PostCSS обрабатывает
  //CSS-код, местом подключения пайпа будет функция, которая отвечает за обработку CSS.
  //Нужно, чтобы код преобразовывался в уже собранном из разных кусочков CSS-файле,
  //поэтому пайп PostCSS добавим после пайпа concat(), но перед загрузкой бандла в папку dist/.
}

function images() {
  return gulp
    .src('src/**/*.{jpg,png,svg,gif,ico,webp,avif}')
    .pipe(gulp.dest('dist/images'))
    .pipe(browserSync.reload({ stream: true }));
  // Перечисление форматов изображений в фигурных скобках.
  // Отсутствие пайпа plumber (когда файлы не меняются, ничего не создаст ошибок).
  //  .pipe(browserSync.reload({ stream: true }))  Этот пайп будет перезагружать страницу браузера при выполнении каждой задачи сборки.
}

function fonts() {
  return gulp
    .src('src/fonts/**/*.{tiff,tif,woff,woff2}')
    .pipe(gulp.dest('dist/fonts'))
    .pipe(browserSync.reload({ stream: true }));
  // Перечисление форматов изображений в фигурных скобках.
  // Отсутствие пайпа plumber (когда файлы не меняются, ничего не создаст ошибок).
  //  .pipe(browserSync.reload({ stream: true }))  Этот пайп будет перезагружать страницу браузера при выполнении каждой задачи сборки.
}

function clean() {
  return del('dist');
  //   Перед каждой сборкой полезно удалить все файлы из папки dist/ и загрузить туда новые результаты
}

const build = gulp.series(clean, gulp.parallel(css, images, fonts));
// gulp build последовательно выполняла все эти четыре команды и не приходилось вводить их по очереди. Для этого внутри Gulp есть два метода:
// series() — выполняет задачи по очереди
// parallel() — выполняет задачи параллельно
// если не установлен Pug => const build = gulp.series(clean, gulp.parallel(html, css, images, fonts));

function watchFiles() {
  // gulp.watch(['src/pages/**/*.pug'], pug);
  gulp.watch(['src/**/*.html'], html);
  gulp.watch(['src/**/*.css'], css);
  gulp.watch(['src/images/**/*.{jpg,png,svg,gif,ico,webp,avif}'], images);
  gulp.watch(['src/fonts/**/*.{tiff,tif,woff,woff2}'], fonts);
}

const watchapp = gulp.parallel(build, watchFiles, server); // Теперь можно добавить параллельное выполнение build, отслеживание и сервер
// *Запуск задачи watchapp следит за файлами в src/ и делает пересборку после каждого изменения этих файлов. Отключить такое слежение в терминале можно клавишами CTRL + C8*

function server() {
  browserSync.init({
    servewr: {
      baseDir: './dist',
    },
  });
  //   изменения папки dist/ в реальном времени в браузере. Для этого мы устанавливали browser-sync.
  // После её добавления в каждой задаче сборки — функциях html(), css() и тд —нужно добавить такие пайпы: .pipe(browserSync.reload({stream: true}));
}

exports.html = html; // строчка, которая позволит вызвать эту задачу из терминала
exports.css = css;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watchapp = watchapp;
exports.default = watchapp; // Теперь функция watchapp будет вызываться из терминала просто по команде gulp
exports.buildDeps = buildDeps;
