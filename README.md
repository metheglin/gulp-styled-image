# gulp-styled-image
==============

## Usage
### Default Usage (generate css)
```javascript
var styledimage = require("gulp-styled-image");
gulp.task("styledimage", function(){
  return gulp.src("images/**/**")
    .pipe(styledimage({
      formats: [
        {
          prefix: "prefix--",
          suffix: "--suffix",
          separator: "--",
          generator: "sass_mixin_default"
        }
      ]
    }))
    .pipe(gulp.dest("./image.scss"))
});
```
