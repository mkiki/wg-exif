/**
 * wg-exif - Exif tag reader unit tests
 */
// (C) Alexandre Morin 2015 - 2016

const assert = require('assert');
const fs = require('fs');
const Log = require('wg-log').Log;
const Exif = require('../lib/exif.js');

Log.configure('wg::exif', { level:'debug' });

function checkExif(fileName, expected, callback) {
  return Exif.extractEXIF(__dirname + '/data/' + fileName, function(err, exif) {
    if (err) return callback(err);
    assert.deepEqual(exif.make, expected.make, "Comparing make");
    assert.deepEqual(exif.model, expected.model, "Comparing model");
    assert.deepEqual(exif.width, expected.width, "Comparing width");
    assert.deepEqual(exif.height, expected.height, "Comparing height");
    assert.deepEqual(exif.resolution, expected.resolution, "Comparing resolution");
    assert.deepEqual(exif.orientation, expected.orientation, "Comparing orientation");
    assert.deepEqual(exif.dateTime, new Date(expected.dateTime), "Comparing dateTime");
    assert.deepEqual(exif.focalLength, expected.focalLength, "Comparing focalLength");
    assert.deepEqual(exif.exposureTime, expected.exposureTime, "Comparing exposureTime");
    assert.deepEqual(exif.fNumber, expected.fNumber, "Comparing fNumber");
    return callback();
  });  
}


describe('Exif', function() {

  it('Check Exif tags', function(done) {
    return checkExif('00001.jpg', {
      "make": "Canon",
      "model": "Canon PowerShot G5",
      "width": 1600,
      "height": 1200,
      "resolution": "180x180",
      "orientation": 1,
      "dateTime": "2006-11-12T17:08:24.000Z",
      "focalLength": 7.188,
      "exposureTime": 0.017,
      "fNumber": 2
    }, function() {
      return done();
    });
  });

});

