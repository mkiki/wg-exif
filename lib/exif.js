/**
 * EXIF extractor
 *
 * References
 * ==========
 * 
 * Exif tags:     http://www.exiv2.org/tags.html
 * Orientation:   http://sylvana.net/jpegcrop/exif_orientation.html
 */
// (C) Alexandre Morin 2015 - 2016

const child_process = require('child_process');
const Log = require('wg-log').Log;
const Exception = require('wg-log').Exception;
const utils = require('wg-utils');
const moment = require('moment');
const fs = require('fs');
const extend = require('extend');

const log = Log.getLogger('wg::exif');


/** ================================================================================
 * Setup module
 * ================================================================================ */

// ImageMagick identify OS command
var IDENTIFY = "identify";

function setup(settings) {
  IDENTIFY = settings.identify || IDENTIFY;
}


/** ================================================================================
  * Extract Exif
  * @param filename       is the full name of the file to scan
  * @param callback       is the return function
  *                         err - is the error code/message
  *                         exif - is the extracted exif information
  * ================================================================================ */
function extractEXIF(filename, callback) {
  log.debug({ filename:filename }, "exif.extractEXIF");

  return _imageMagickExtractEXIF(filename, function(err, exif) {
    log.debug({ err:err, exif:exif, filename:filename }, "Exif information");
    return callback(err, exif);
  });
}

function _imageMagickExtractEXIF(filename, callback) {
  var command = '';
  command += ' ' + IDENTIFY;
  command += ' -format';
  command += ' "%[exif:*]\\n%[date:*]\\nwidth=%w\\nheight=%h\\nxResolution=%x\\nyResolution=%y\\n"';
  command += ' "' + utils.escapeFilenameForCommand(filename, true) + '"';

  var options = {
    encoding: 'utf8',
    timeout: 20000
  };

  log.debug({ command:command }, "Executing command");
  child_process.exec(command, options, function(err, stdout, stderr) {
    if (err) return callback(err);
    return _parseExif(stdout, function(err, exif) {
      return callback(err, exif);
    });
  });
};

function _parseExif(stdout, callback) {
  // Parse all lined and create a map of attributes
  var map = {};
  var lines = stdout.split('\n');
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];
    if (line === null || line === undefined) continue;
    line = line.trim();
    var index = line.indexOf('=');
    if (index === -1) continue;
    var name = line.substr(0, index).trim().toLowerCase();
    var value = line.substr(index+1).trim();
    log.debug({attrName:name,attrValue:value}, "Parsing attribute");
    if (name === 'exif:make')               map.make = _parseString(value);
    if (name === 'exif:model')              map.model = _parseString(value);
    if (name === 'width')                   map.width = _parseInt(value);
    if (name === 'height')                  map.height = _parseInt(value);
    if (name === 'exif:xresolution')        map.xResolution = _parseRational(value);
    if (name === 'exif:yresolution')        map.yResolution = _parseRational(value);
    if (name === 'exif:orientation')        map.orientation = _parseOrientation(value);
    if (name === 'exif:datetimeoriginal')   map.dateTimeOriginal = _parseDate(value);
    if (name === 'exif:datetimedigitized')  map.dateTimeDigitized = _parseDate(value);
    if (name === 'date:modify')             map.dateModify = _parseDateISO(value);
    if (name === 'date:create')             map.dateCreate = _parseDateISO(value);
    if (name === 'exif:focallength')        map.focalLength = _parseRational(value);
    if (name === 'exif:exposuretime')       map.exposureTime = _parseRational(value);
    if (name === 'exif:fnumber')            map.fNumber = _parseRational(value);
    if (name === 'exif:customrendered')     map.customRendered = _parseInt(value);

    if (name === 'exif:gpsaltitude')        map.altitude = _parseRational(value);
    if (name === 'exif:gpsaltituderef')     map.altitudeRef = _parseInt(value);         // 0=above sea level, 1=below sea level
    //if (name === 'exif:GPSDateStamp')     map.customRendered = _parseInt(value);
    if (name === 'exif:gpslatitude')        map.latitude = _parse3Rationals(value);
    if (name === 'exif:gpslatituderef')     map.latitudeRef = _parseChar(value);        // N=north, S=south
    if (name === 'exif:gpslongitude')       map.longitude = _parse3Rationals(value);
    if (name === 'exif:gpslongituderef')    map.longitudeRef = _parseChar(value);       // E=east, W=west
  }

  // Determine exif structure by priorities

  // HDR: The CustomRenderer field has a value of 4 for the original image and 3 for HDR.
  //      As a bonus, Panorama-photos also have this tag set with a value of 6 –
  var hdr = undefined;
  if (map.make && map.make.toLowerCase()==='apple' && map.customRendered===3) hdr = true;
  if (map.make && map.make.toLowerCase()==='apple' && map.customRendered===4) hdr = false;

  // Convert GPS coordingates to latitude & longitude
  var lat, lon;
  if (map.latitude && map.latitudeRef && map.longitude && map.longitudeRef) {
    lat = map.latitude[0] + map.latitude[1]/60 + map.latitude[2]/3600
    lon = map.longitude[0] + map.longitude[1]/60 + map.longitude[2]/3600
    if (map.latitudeRef === 'S') lat = -lat
    if (map.longitudeRef === 'W') lon = -lon
  }
  var alt;
  if (map.altitude && map.altitudeRef!==null && map.altitudeRef!==undefined) {
    alt = map.altitude;
    if (map.altitudeRef === 1) alt = -alt;
  }

  var exif = {
    make:         map['make'],
    model:        map['model'],
    width:        map['width'],
    height:       map['height'],
    resolution:   (map['xResolution'] && map['yResolution']) ? map['xResolution'] + 'x' + map['yResolution'] : undefined,
    orientation:  map['orientation'],
    dateTime:     map['dateTimeDigitized'] || map['dateTimeOriginal'] || map['dateModify'] || map['dateCreate'],
    focalLength:  map['focalLength'],
    exposureTime: map['exposureTime'],
    fNumber:      map['fNumber'],
    hdr:          hdr,
    latitude:     lat,
    longitude:    lon,
    altitude:     alt
  } 
  return callback(null, exif);
}

function _parseString(value) {
  if (value === undefined || value === null) return "";
  return value;
}

function _parseChar(value) {
  if (value === undefined || value === null) return "";
  return value[0];
}

// Map exif orientation to numeric orientation values
var _exifOrientations = {
  "topleft": 1,
  "topright": 2,
  "bottomright": 3,
  "bottomleft": 4,
  "lefttop": 5,
  "righttop": 6,
  "rightbottom": 7,
  "leftbottom": 8,
}
function _parseOrientation(value) {
  if (value === undefined || value === null) return "";
  if (value.toLowerCase)
    value = value.toLowerCase().replace('-', '');
  if (value.length===0 || value==='undefined') return undefined;
  var o = _exifOrientations[value];
  if (o !== undefined && o === o) return o;
  o = parseInt(value, 10);
  return o;
}

function _parseInt(value) {
  if (value === undefined || value === null) return undefined;
  value = parseInt(value, 10);
  return value;
}

function _parseDate(value) { 
  var m = moment(value, "YYYY:MM:DD HH:mm:ss");
  if (!m.isValid()) return undefined;
  if (m.year() < 1970) return undefined;
  if (m.year() > 2099) return undefined;
  return m.toDate();
}

function _parseDateISO(value) { 
  var m = moment(value);
  if (!m.isValid()) return undefined;
  if (m.year() < 1970) return undefined;
  if (m.year() > 2099) return undefined;
  return m.toDate();
}

function _parseRational(value) {
  var r = undefined;
  value = value.replace('mm', '').trim();
  var index = value.indexOf('/');
  if (index === -1) r = parseFloat(value, 10);
  else {
    var a = parseFloat(value.substr(0, index).trim(), 10);
    var b = parseFloat(value.substr(index+1).trim(), 10);
    r = Math.round(1000*(a / b)) / 1000.; // round to 3 decimals
  }
  if (r !== r) r = undefined;
  return r;
}

function _parse3Rationals(value) {
  if (!value || value.length===0) return undefined;
  var three = value.split(',');
  if (!three || three.length<3) return undefined;
  var r1 = _parseRational(three[0]);
  var r2 = _parseRational(three[1]);
  var r3 = _parseRational(three[2]);
  return [r1, r2, r3];
}

/** ================================================================================
  * Public interface
  * ================================================================================ */
module.exports = {
  setup:                  setup,
  extractEXIF:            extractEXIF
};


