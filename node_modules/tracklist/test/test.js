var assert = require("assert");

tracklist = require("../lib/tracklist");

tracklist(__dirname + "/Jesuses", function(err, tracks) {
  if (err) { throw err; }

 var expected = [
    "The We Shared Milk - Aye Drum",
    "The We Shared Milk - Butcher",
    "The We Shared Milk - Cookie Jar",
    "The We Shared Milk - Drag",
    "The We Shared Milk - I Picked Up The Axe",
    "The We Shared Milk - Come Home",
    "The We Shared Milk - Moon Mother"
  ];

  tracks.forEach(function (t, i) {

    var actual = (t.artist || "???") + " - " + (t.title || "???");

    // The order of the tracks is *not* guaranteed.
    assert.ok(-~expected.indexOf(actual), expected[i]+" !== "+actual);
    console.log("✓ Track "+(i+1));
  });
});
