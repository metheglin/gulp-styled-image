var through2  = require("through2"),
  _           = require("lodash"),
  imagesize   = require("imagesize"),
  libpath     = require("path"),
  gutil       = require("gulp-util");

const PLUGIN_NAME = 'gulp-styled-image';

module.exports = function (param) {
  "use strict";
  // if necessary check for required param(s), e.g. options hash, etc.
  if (!param) {
    param = {};
  }
  var options =  _.defaults(
    param,
    {
      name: "_images.scss",
      root: "/assets/images/",
      formats: [
        {
          prefix: "",
          generator: "sass_mixin_default"
        }
      ]
    }
  )

  var list = []

  // see "Writing a plugin"
  // https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/README.md
  function process(file, enc, callback) {
    /*jshint validthis:true*/

    // Do nothing if no contents
    if (file.isNull()) {
      return callback();
    }
    if (file.isStream()) {
      this.emit("error",
        new gutil.PluginError(PLUGIN_NAME, "Stream content is not supported"));
      return callback();
    }
    // check if file.contents is a `Buffer`
    if (file.isBuffer() || file.isFile()) {
      var parser = imagesize.Parser();

      var retStatus = parser.parse(file.contents);
      if (imagesize.Parser.DONE === retStatus) {
        var result = parser.getResult();
        result.file = libpath.relative(file.base, file.path)
        list.push(result);
      }
    }
    return callback();
  }

  function flush_styled_image( callback ) {
    var txt = "/* This file is generated */\n";
    txt += style_image(list, options);
    this.push(new gutil.File({
      base: "",
      path: options.name,
      contents: new Buffer(txt)
    }));
    return callback();
  }

  function style_image(images, _options) {
    var presets = {
      sass_mixin_default: function( label_name, path, w, h ) {
        return "@mixin " + label_name + "() {" + 
          "display:block;" +
          "width:" + w + "px;" + 
          "height:" + h + "px;" + 
          "background-image:" + "url(" + path + ");" +
          "background-size:" + w + "px " + h + "px;" +
          "}"
      },
      sass_vars_default: function( label_name, path, w, h ) {
        return "$" + label_name + "__path: '" + path + "';\n" +
          "$" + label_name + "__width: " + w + "px;\n" +
          "$" + label_name + "__height: " + h + "px;"
      },
      sass_mixin_relative: function( label_name, path, w, h ) {
        var h_ratio = ( h/w ) * 100
        return "@mixin " + label_name + "() {" + 
          "display:block;" +
          "width:100%" + 
          "height:auto" + 
          "padding-bottom:" + h_ratio + "%;" +
          "background-image:" + "url(" + path + ");" +
          "background-size:contain;" +
          "}"
      }
    }

    var result = ""
    for ( var i=0; i < images.length; i++ ) {
      var img = images[i];

      for ( var index in _options.formats ) {
        var f = _options.formats[index]
        var generator   = f.generator
        var generated   = ""
        var label       = label_name(
          img.file, 
          _.pick(f, ['prefix', 'suffix', 'separator'])
        )
        var img_path    = image_path( img.file )

        if ( typeof generator === 'string' || generator instanceof String ) {
          generator = presets[ generator ] ? presets[ generator ] : generator
        }
        if ( generator instanceof Function ) {
          generated = generator( label, img_path, img.width, img.height )
        } else if ( ! generator ) {
          generated = ""
        } else {
          generated = generator.toString()
        }
        
        result += generated + "\n"
      }
    }
    // console.log("res", result)
    return result;
  }

  function label_name( filepath, options ) {
    var invalidChars = /[^0-9a-zA-Z-_]/g
    var prefix    = options && (typeof options.prefix !== "undefined") ? options.prefix : ""
    var suffix    = options && (typeof options.suffix !== "undefined") ? options.suffix : ""
    var separator = (options && options.separator) || "-"
    // parse available since node v6
    // var fileinfo  = libpath.parse( filepath )
    var file_dir  = libpath.dirname( filepath )
    var file_ext  = libpath.extname( filepath )
    var file_name = libpath.basename( filepath, file_ext )
    var pathes    = file_dir.split( libpath.sep )
    pathes.push( file_name )
    pathes = _.map( pathes, function(p){ return p.replace(invalidChars, '') })
    pathes = _.filter( pathes, function(p){ return p !== "" })
    return prefix + pathes.join( separator ) + suffix
  }

  function image_path( filepath ) {
    return options.root + filepath
  }

  return through2.obj( process, flush_styled_image );
}
