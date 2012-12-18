# Tracklist

Reads the id3 data for all mp3s in a folder.

## Example:

    #!/usr/bin/env node

    tracklist = require("../lib/tracklist");

    tracklist(process.argv[2] || ".", function (err, results) {
      if (err) {
        console.log(err);
      } else {
        results.sort().forEach(function (t) {
          console.log((t.artist || "???") + " - " + (t.title || "???"));
        });
      }
    });

## Install:

    npm install tracklist

## Usage:

    $ ./bin/tracklist test/
    The We Shared Milk - Aye Drum
    The We Shared Milk - Butcher
    The We Shared Milk - Cookie Jar
    The We Shared Milk - Drag
    The We Shared Milk - I Picked Up The Axe
    The We Shared Milk - Come Home
    The We Shared Milk - Moon Mother

You can also use it programmatically:

    tracklist = require("tracklist");

    tracklist("path/to/jams", function (err, results) {
      // results is a list of tag objects
    });

One property is attached to the results that's not from a tag name: "filepath", or the path to the file.

## License:

MIT/X11.
