var gutil = require("gulp-util"),
    gulp = require("gulp"),
    fs = require("fs"),
    styledimage = require("../"),
    through2 = require("through2"),
    libpath = require("path"),
    should = require("chai").should();

describe("test gulp-styled-image", function(){
  var check = function(options){
    return gulp.src(libpath.join(__dirname, "fixtures", "images", "**/**"))
      .pipe( styledimage(options))
  }

  it("check sass_mixin_default", function(done){
    var contents = fs.readFileSync(
      libpath.join(__dirname, "expected", "_preset_sass_mixin_default.scss")
    ).toString();
    // console.log(contents)
    check({
      root: "http://example.com/",
      formats: [
        {
          prefix: "inc--",
          suffix: "--rel",
          separator: "++",
          generator: "sass_mixin_default"
        }
      ]
    }).pipe(through2.obj(function(newFile, enc, cb){
      // console.log(newFile.contents.toString())
      should.exist(newFile);
      should.exist(newFile.contents);
      contents.should.eql(newFile.contents.toString());
      cb();
      done();
    }));
  });

  it("check multiple", function(done){
    var contents = fs.readFileSync(
      libpath.join(__dirname, "expected", "_multiple.scss")
    ).toString();
    check({
      root: "/assets/images/",
      formats: [
        {
          generator: "sass_mixin_default"
        },
        {
          generator: "sass_vars_default"
        },
        {
          generator: "sass_mixin_relative"
        },
      ]
    }).pipe(through2.obj(function(newFile, enc, cb){
      should.exist(newFile);
      should.exist(newFile.contents);
      contents.should.eql(newFile.contents.toString());
      cb();
      done();
    }));
  });

  it("check custom", function(done){
    var contents = fs.readFileSync(
      libpath.join(__dirname, "expected", "_custom_mixin.scss")
    ).toString();
    // console.log(contents)
    check({
      root: "/assets/images/",
      formats: [
        {
          prefix: "inc--",
          suffix: "--rel",
          separator: "++",
          generator: function( label_name, path, w, h ) {
            var h_ratio = (h / w) * 100
            return "@mixin " + label_name + "() {" + 
              "display:block;" +
              "width:100%;" + 
              "height:auto;" + 
              "padding-bottom:" + h_ratio + "%;" +
              "background-image:" + "url(" + path + ");" +
              "background-size:contain;" +
              "}"
          }
        }
      ]
    }).pipe(through2.obj(function(newFile, enc, cb){
      // console.log(newFile.contents.toString())
      should.exist(newFile);
      should.exist(newFile.contents);
      contents.should.eql(newFile.contents.toString());
      cb();
      done();
    }));
  });

});
