var fs = require("fs"),
    id3 = require("id3"),
    findit = require("findit"),
    path = require("path"),
    zippy = require("zippy"),
    Hash = require("hashish"),
    alists = require("alists"),
    EE = require("events").EventEmitter;

var track = module.exports;


var getTags = function (p, cb) {
  if (path.extname(p) === ".mp3") {

    fs.readFile(p, function (err, buff) {
      if (err) {
        throw err;
      }

      cb(p, id3(buff));
    });
  }
}

var getTagsSync = function (p) {

  return alists.toObj(findit
    .sync(p)
    .filter(function (f) {
      return (path.extname(f) === ".mp3");
    }).map(function (p) {
      return [p, id3(fs.readFileSync(p))];
    }));
}



track.list = function (p, cb) {

  var ee = new EE();

  var finder = findit.find(p, function (f) {

    getTags(f, cb);

  });

  finder.on("file", function (f) {
    getTags(f, ee.emit.bind(ee, "file"));
  });

  finder.on("end", ee.emit.bind(ee, "end"));

  return ee;

}

track.sync = getTagsSync;
