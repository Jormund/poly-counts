// ==UserScript==
// @id             iitc-plugin-polyCounts22
// @name           IITC : Poly Counts 2
// @category       Info
// @version        2.0.1.20180330.1555
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://cdn.rawgit.com/Jormund/poly-counts/master/poly-counts2.meta.js
// @downloadURL    https://cdn.rawgit.com/Jormund/poly-counts/master/poly-counts2.user.js
// @description    [2018-03-30-1555] Display a list of all localized portals by level and faction.
// @include        https://ingress.com/intel*
// @include        http://ingress.com/intel*
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @grant          none
// ==/UserScript==
//improvements on carb.poly-counts.user.js

// PLUGIN START
function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START

/* CHANGELOG
 - v0.0.1  : modified portal counts to filter in drawn polys
 - v1.0.0  : Count in search result when available, drawn items otherwise
 - v2.0.0  : activate on ingress.com (without www)
 - v2.0.1  : use google maps API for inside detection if available (google.maps.geometry.poly.containsLocation)
*/

// use own namespace for plugin
window.plugin.polyCounts2 = {
  BAR_TOP: 20,
  BAR_HEIGHT: 180,
  BAR_WIDTH: 25,
  BAR_PADDING: 5,
  RADIUS_INNER: 70,
  RADIUS_OUTER: 100,
  CENTER_X: 200,
  CENTER_Y: 100,
};

window.plugin.polyCounts2.loadExternals = function() {
    try { console.log('Loading leaflet-pip JS now'); } catch(e) {}
    // leaflet-pip
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.leafletPip=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var gju = _dereq_('geojson-utils');

var leafletPip = {
    bassackwards: false,
    pointInLayer: function(p, layer, first) {
        'use strict';
        if (p instanceof L.LatLng) p = [p.lng, p.lat];
        else if (leafletPip.bassackwards) p.reverse();

        var results = [];

        layer.eachLayer(function(l) {
            if (first && results.length) return;
            if ((l instanceof L.MultiPolygon ||
                 l instanceof L.Polygon) &&
                gju.pointInPolygon({
                    type: 'Point',
                    coordinates: p
                }, l.toGeoJSON().geometry)) {
                results.push(l);
            }
        });
        return results;
    }
};

module.exports = leafletPip;

},{"geojson-utils":2}],2:[function(_dereq_,module,exports){
(function () {
  var gju = this.gju = {};

  // Export the geojson object for **CommonJS**
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = gju;
  }

  // adapted from http://www.kevlindev.com/gui/math/intersection/Intersection.js
  gju.lineStringsIntersect = function (l1, l2) {
    var intersects = [];
    for (var i = 0; i <= l1.coordinates.length - 2; ++i) {
      for (var j = 0; j <= l2.coordinates.length - 2; ++j) {
        var a1 = {
          x: l1.coordinates[i][1],
          y: l1.coordinates[i][0]
        },
          a2 = {
            x: l1.coordinates[i + 1][1],
            y: l1.coordinates[i + 1][0]
          },
          b1 = {
            x: l2.coordinates[j][1],
            y: l2.coordinates[j][0]
          },
          b2 = {
            x: l2.coordinates[j + 1][1],
            y: l2.coordinates[j + 1][0]
          },
          ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
          ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
          u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
        if (u_b != 0) {
          var ua = ua_t / u_b,
            ub = ub_t / u_b;
          if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            intersects.push({
              'type': 'Point',
              'coordinates': [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)]
            });
          }
        }
      }
    }
    if (intersects.length == 0) intersects = false;
    return intersects;
  }

  // Bounding Box

  function boundingBoxAroundPolyCoords (coords) {
    var xAll = [], yAll = []

    for (var i = 0; i < coords[0].length; i++) {
      xAll.push(coords[0][i][1])
      yAll.push(coords[0][i][0])
    }

    xAll = xAll.sort(function (a,b) { return a - b })
    yAll = yAll.sort(function (a,b) { return a - b })

    return [ [xAll[0], yAll[0]], [xAll[xAll.length - 1], yAll[yAll.length - 1]] ]
  }

  gju.pointInBoundingBox = function (point, bounds) {
    return !(point.coordinates[1] < bounds[0][0] || point.coordinates[1] > bounds[1][0] || point.coordinates[0] < bounds[0][1] || point.coordinates[0] > bounds[1][1]) 
  }

  // Point in Polygon
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices

  function pnpoly (x,y,coords) {
    var vert = [ [0,0] ]

    for (var i = 0; i < coords.length; i++) {
      for (var j = 0; j < coords[i].length; j++) {
        vert.push(coords[i][j])
      }
	  vert.push(coords[i][0])
      vert.push([0,0])
    }

    var inside = false
    for (var i = 0, j = vert.length - 1; i < vert.length; j = i++) {
      if (((vert[i][0] > y) != (vert[j][0] > y)) && (x < (vert[j][1] - vert[i][1]) * (y - vert[i][0]) / (vert[j][0] - vert[i][0]) + vert[i][1])) inside = !inside
    }

    return inside
  }

  gju.pointInPolygon = function (p, poly) {
    var coords = (poly.type == "Polygon") ? [ poly.coordinates ] : poly.coordinates

    var insideBox = false
    for (var i = 0; i < coords.length; i++) {
      if (gju.pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[i]))) insideBox = true
    }
    if (!insideBox) return false

    var insidePoly = false
    for (var i = 0; i < coords.length; i++) {
      if (pnpoly(p.coordinates[1], p.coordinates[0], coords[i])) insidePoly = true
    }

    return insidePoly
  }

  // support multi (but not donut) polygons
  gju.pointInMultiPolygon = function (p, poly) {
    var coords_array = (poly.type == "MultiPolygon") ? [ poly.coordinates ] : poly.coordinates

    var insideBox = false
    var insidePoly = false
    for (var i = 0; i < coords_array.length; i++){
      var coords = coords_array[i];
      for (var j = 0; j < coords.length; j++) {
        if (!insideBox){
          if (gju.pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[j]))) {
            insideBox = true
          }
        }
      }
      if (!insideBox) return false
      for (var j = 0; j < coords.length; j++) {
        if (!insidePoly){
          if (pnpoly(p.coordinates[1], p.coordinates[0], coords[j])) {
            insidePoly = true
          }
        }
      }
    }

    return insidePoly
  }

  gju.numberToRadius = function (number) {
    return number * Math.PI / 180;
  }

  gju.numberToDegree = function (number) {
    return number * 180 / Math.PI;
  }

  // written with help from @tautologe
  gju.drawCircle = function (radiusInMeters, centerPoint, steps) {
    var center = [centerPoint.coordinates[1], centerPoint.coordinates[0]],
      dist = (radiusInMeters / 1000) / 6371,
      // convert meters to radiant
      radCenter = [gju.numberToRadius(center[0]), gju.numberToRadius(center[1])],
      steps = steps || 15,
      // 15 sided circle
      poly = [[center[0], center[1]]];
    for (var i = 0; i < steps; i++) {
      var brng = 2 * Math.PI * i / steps;
      var lat = Math.asin(Math.sin(radCenter[0]) * Math.cos(dist)
              + Math.cos(radCenter[0]) * Math.sin(dist) * Math.cos(brng));
      var lng = radCenter[1] + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(radCenter[0]),
                                          Math.cos(dist) - Math.sin(radCenter[0]) * Math.sin(lat));
      poly[i] = [];
      poly[i][1] = gju.numberToDegree(lat);
      poly[i][0] = gju.numberToDegree(lng);
    }
    return {
      "type": "Polygon",
      "coordinates": [poly]
    };
  }

  // assumes rectangle starts at lower left point
  gju.rectangleCentroid = function (rectangle) {
    var bbox = rectangle.coordinates[0];
    var xmin = bbox[0][0],
      ymin = bbox[0][1],
      xmax = bbox[2][0],
      ymax = bbox[2][1];
    var xwidth = xmax - xmin;
    var ywidth = ymax - ymin;
    return {
      'type': 'Point',
      'coordinates': [xmin + xwidth / 2, ymin + ywidth / 2]
    };
  }

  // from http://www.movable-type.co.uk/scripts/latlong.html
  gju.pointDistance = function (pt1, pt2) {
    var lon1 = pt1.coordinates[0],
      lat1 = pt1.coordinates[1],
      lon2 = pt2.coordinates[0],
      lat2 = pt2.coordinates[1],
      dLat = gju.numberToRadius(lat2 - lat1),
      dLon = gju.numberToRadius(lon2 - lon1),
      a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(gju.numberToRadius(lat1))
        * Math.cos(gju.numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2),
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (6371 * c) * 1000; // returns meters
  },

  // checks if geometry lies entirely within a circle
  // works with Point, LineString, Polygon
  gju.geometryWithinRadius = function (geometry, center, radius) {
    if (geometry.type == 'Point') {
      return gju.pointDistance(geometry, center) <= radius;
    } else if (geometry.type == 'LineString' || geometry.type == 'Polygon') {
      var point = {};
      var coordinates;
      if (geometry.type == 'Polygon') {
        // it's enough to check the exterior ring of the Polygon
        coordinates = geometry.coordinates[0];
      } else {
        coordinates = geometry.coordinates;
      }
      for (var i in coordinates) {
        point.coordinates = coordinates[i];
        if (gju.pointDistance(point, center) > radius) {
          return false;
        }
      }
    }
    return true;
  }

  // adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
  gju.area = function (polygon) {
    var area = 0;
    // TODO: polygon holes at coordinates[1]
    var points = polygon.coordinates[0];
    var j = points.length - 1;
    var p1, p2;

    for (var i = 0; i < points.length; j = i++) {
      var p1 = {
        x: points[i][1],
        y: points[i][0]
      };
      var p2 = {
        x: points[j][1],
        y: points[j][0]
      };
      area += p1.x * p2.y;
      area -= p1.y * p2.x;
    }

    area /= 2;
    return area;
  },

  // adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
  gju.centroid = function (polygon) {
    var f, x = 0,
      y = 0;
    // TODO: polygon holes at coordinates[1]
    var points = polygon.coordinates[0];
    var j = points.length - 1;
    var p1, p2;

    for (var i = 0; i < points.length; j = i++) {
      var p1 = {
        x: points[i][1],
        y: points[i][0]
      };
      var p2 = {
        x: points[j][1],
        y: points[j][0]
      };
      f = p1.x * p2.y - p2.x * p1.y;
      x += (p1.x + p2.x) * f;
      y += (p1.y + p2.y) * f;
    }

    f = gju.area(polygon) * 6;
    return {
      'type': 'Point',
      'coordinates': [y / f, x / f]
    };
  },

  gju.simplify = function (source, kink) { /* source[] array of geojson points */
    /* kink	in metres, kinks above this depth kept  */
    /* kink depth is the height of the triangle abc where a-b and b-c are two consecutive line segments */
    kink = kink || 20;
    source = source.map(function (o) {
      return {
        lng: o.coordinates[0],
        lat: o.coordinates[1]
      }
    });

    var n_source, n_stack, n_dest, start, end, i, sig;
    var dev_sqr, max_dev_sqr, band_sqr;
    var x12, y12, d12, x13, y13, d13, x23, y23, d23;
    var F = (Math.PI / 180.0) * 0.5;
    var index = new Array(); /* aray of indexes of source points to include in the reduced line */
    var sig_start = new Array(); /* indices of start & end of working section */
    var sig_end = new Array();

    /* check for simple cases */

    if (source.length < 3) return (source); /* one or two points */

    /* more complex case. initialize stack */

    n_source = source.length;
    band_sqr = kink * 360.0 / (2.0 * Math.PI * 6378137.0); /* Now in degrees */
    band_sqr *= band_sqr;
    n_dest = 0;
    sig_start[0] = 0;
    sig_end[0] = n_source - 1;
    n_stack = 1;

    /* while the stack is not empty  ... */
    while (n_stack > 0) {

      /* ... pop the top-most entries off the stacks */

      start = sig_start[n_stack - 1];
      end = sig_end[n_stack - 1];
      n_stack--;

      if ((end - start) > 1) { /* any intermediate points ? */

        /* ... yes, so find most deviant intermediate point to
        either side of line joining start & end points */

        x12 = (source[end].lng() - source[start].lng());
        y12 = (source[end].lat() - source[start].lat());
        if (Math.abs(x12) > 180.0) x12 = 360.0 - Math.abs(x12);
        x12 *= Math.cos(F * (source[end].lat() + source[start].lat())); /* use avg lat to reduce lng */
        d12 = (x12 * x12) + (y12 * y12);

        for (i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++) {

          x13 = source[i].lng() - source[start].lng();
          y13 = source[i].lat() - source[start].lat();
          if (Math.abs(x13) > 180.0) x13 = 360.0 - Math.abs(x13);
          x13 *= Math.cos(F * (source[i].lat() + source[start].lat()));
          d13 = (x13 * x13) + (y13 * y13);

          x23 = source[i].lng() - source[end].lng();
          y23 = source[i].lat() - source[end].lat();
          if (Math.abs(x23) > 180.0) x23 = 360.0 - Math.abs(x23);
          x23 *= Math.cos(F * (source[i].lat() + source[end].lat()));
          d23 = (x23 * x23) + (y23 * y23);

          if (d13 >= (d12 + d23)) dev_sqr = d23;
          else if (d23 >= (d12 + d13)) dev_sqr = d13;
          else dev_sqr = (x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12) / d12; // solve triangle
          if (dev_sqr > max_dev_sqr) {
            sig = i;
            max_dev_sqr = dev_sqr;
          }
        }

        if (max_dev_sqr < band_sqr) { /* is there a sig. intermediate point ? */
          /* ... no, so transfer current start point */
          index[n_dest] = start;
          n_dest++;
        } else { /* ... yes, so push two sub-sections on stack for further processing */
          n_stack++;
          sig_start[n_stack - 1] = sig;
          sig_end[n_stack - 1] = end;
          n_stack++;
          sig_start[n_stack - 1] = start;
          sig_end[n_stack - 1] = sig;
        }
      } else { /* ... no intermediate points, so transfer current start point */
        index[n_dest] = start;
        n_dest++;
      }
    }

    /* transfer last point */
    index[n_dest] = n_source - 1;
    n_dest++;

    /* make return array */
    var r = new Array();
    for (var i = 0; i < n_dest; i++)
      r.push(source[index[i]]);

    return r.map(function (o) {
      return {
        type: "Point",
        coordinates: [o.lng, o.lat]
      }
    });
  }

  // http://www.movable-type.co.uk/scripts/latlong.html#destPoint
  gju.destinationPoint = function (pt, brng, dist) {
    dist = dist/6371;  // convert dist to angular distance in radians
    brng = gju.numberToRadius(brng);

    var lon1 = gju.numberToRadius(pt.coordinates[0]);
    var lat1 = gju.numberToRadius(pt.coordinates[1]);

    var lat2 = Math.asin( Math.sin(lat1)*Math.cos(dist) +
                          Math.cos(lat1)*Math.sin(dist)*Math.cos(brng) );
    var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(dist)*Math.cos(lat1),
                                 Math.cos(dist)-Math.sin(lat1)*Math.sin(lat2));
    lon2 = (lon2+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180º

    return {
      'type': 'Point',
      'coordinates': [gju.numberToDegree(lon2), gju.numberToDegree(lat2)]
    };
  };

})();

},{}]},{},[1])
(1)
});
    try { console.log('done loading leaflet-pip JS'); } catch(e) {}
};

//count portals for each level available on the map
window.plugin.polyCounts2.getPortals = function () {
  //console.log('** getPortals');
  var self = window.plugin.polyCounts2;
  self.enlP = 0;
  self.resP = 0;
  self.neuP = 0;

  self.PortalsEnl = [];
  self.PortalsRes = [];
  for (var level = window.MAX_PORTAL_LEVEL; level > 0; level--) {
    self.PortalsEnl[level] = 0;
    self.PortalsRes[level] = 0;
  }

  var layer = window.plugin.drawTools.drawnItems;
  if (window.search.lastSearch &&
    window.search.lastSearch.selectedResult &&
    window.search.lastSearch.selectedResult.layer)
    layer = window.search.lastSearch.selectedResult.layer;

  $.each(window.portals, function (i, portal) {
    var level = portal.options.level;
    var team = portal.options.team;
    // just count portals in viewport
    var latLng = portal.getLatLng();
    if (leafletPip.pointInLayer(latLng, layer).length == 0) return true;

    switch (team) {
      case 1 :
        self.resP++;
        self.PortalsRes[level]++;
        break;
      case 2 :
        self.enlP++;
        self.PortalsEnl[level]++;
        break;
      default:
        self.neuP++;
        break;
    }
  });

  //get portals informations from IITC
  var minlvl = getMinPortalLevel();
  var total = self.neuP + self.enlP + self.resP;

  var counts = '';
  if (total > 0) {
    counts += '<table><tr><th></th><th class="enl">Enlightened</th><th class="res">Resistance</th></tr>';  //'+self.enlP+' Portal(s)</th></tr>';
    for (var level = window.MAX_PORTAL_LEVEL; level > 0; level--) {
      counts += '<tr><td class="L' + level + '">Level ' + level + '</td>';
      if (minlvl > level)
        counts += '<td colspan="2">zoom in to see portals in this level</td>';
      else
        counts += '<td class="enl">' + self.PortalsEnl[level] + '</td><td class="res">' + self.PortalsRes[level] + '</td>';
      counts += '</tr>';
    }

    counts += '<tr><th>Total:</th><td class="enl">' + self.enlP + '</td><td class="res">' + self.resP + '</td></tr>';

    counts += '<tr><td>Neutral:</td><td colspan="2">';
    if (minlvl > 0)
      counts += 'zoom in to see unclaimed portals';
    else
      counts += self.neuP;
    counts += '</td></tr></table>';

    var svg = $('<svg width="300" height="200">').css('margin-top', 10);

    var all = self.PortalsRes.map(function (val, i) { return val + self.PortalsEnl[i] });
    all[0] = self.neuP;

    // bar graphs
    self.makeBar(self.PortalsEnl, 'Enl', COLORS[2], 0).appendTo(svg);
    self.makeBar(all, 'All', '#FFFFFF', 1 * (self.BAR_WIDTH + self.BAR_PADDING)).appendTo(svg);
    self.makeBar(self.PortalsRes, 'Res', COLORS[1], 2 * (self.BAR_WIDTH + self.BAR_PADDING)).appendTo(svg);

    // pie graph
    var g = $('<g>')
      .attr('transform', self.format('translate(%s,%s)', self.CENTER_X, self.CENTER_Y))
      .appendTo(svg);

    // inner parts - factions
    self.makePie(0, self.resP / total, COLORS[1]).appendTo(g);
    self.makePie(self.resP / total, (self.neuP + self.resP) / total, COLORS[0]).appendTo(g);
    self.makePie((self.neuP + self.resP) / total, 1, COLORS[2]).appendTo(g);

    // outer part - levels
    var angle = 0;
    for (var i = self.PortalsRes.length - 1; i >= 0; i--) {
      if (!self.PortalsRes[i])
        continue;

      var diff = self.PortalsRes[i] / total;
      self.makeRing(angle, angle + diff, COLORS_LVL[i]).appendTo(g);
      angle += diff;
    }

    var diff = self.neuP / total;
    self.makeRing(angle, angle + diff, COLORS_LVL[0]).appendTo(g);
    angle += diff;

    for (var i = 0; i < self.PortalsEnl.length; i++) {
      if (!self.PortalsEnl[i])
        continue;

      var diff = self.PortalsEnl[i] / total;
      self.makeRing(angle, angle + diff, COLORS_LVL[i]).appendTo(g);
      angle += diff;
    }

    // black line from center to top
    $('<line>')
      .attr({
        x1: self.resP < self.enlP ? 0.5 : -0.5,
        y1: 0,
        x2: self.resP < self.enlP ? 0.5 : -0.5,
        y2: -self.RADIUS_OUTER,
        stroke: '#000',
        'stroke-width': 1
      })
      .appendTo(g);

    // if there are no neutral portals, draw a black line between res and enl
    if (self.neuP == 0) {
      var x = Math.sin((0.5 - self.resP / total) * 2 * Math.PI) * self.RADIUS_OUTER;
      var y = Math.cos((0.5 - self.resP / total) * 2 * Math.PI) * self.RADIUS_OUTER;

      $('<line>')
        .attr({
          x1: self.resP < self.enlP ? 0.5 : -0.5,
          y1: 0,
          x2: x,
          y2: y,
          stroke: '#000',
          'stroke-width': 1
        })
        .appendTo(g);
    }

    counts += $('<div>').append(svg).html();
  } else {
    counts += '<p>No Portals in range!</p>';
  }

  // I've only seen the backend reduce the portals returned for L4+ or further out zoom levels - but this could change
  // UPDATE: now seen for L2+ in dense areas (map zoom level 14 or lower)
  if (getMinPortalLevel() >= 2) {
    counts += '<p class="help" title="To reduce data usage and speed up map display, the backend servers only return some portals in dense areas."><b>Warning</b>: Poly counts can be inaccurate when zoomed out</p>';
  }

  var total = self.enlP + self.resP + self.neuP;
  var title = total + ' ' + (total == 1 ? 'portal' : 'portals');

  if (window.useAndroidPanes()) {
    $('<div id="polyCounts2" class="mobile">'
    + '<div class="ui-dialog-titlebar"><span class="ui-dialog-title ui-dialog-title-active">' + title + '</span></div>'
    + counts
    + '</div>').appendTo(document.body);
  } else {
    dialog({
      html: '<div id="polyCounts2">' + counts + '</div>',
      title: 'Poly counts: ' + title,
      width: 'auto'
    });
  }
};

window.plugin.polyCounts2.makeBar = function(portals, text, color, shift) {
  var self = window.plugin.polyCounts2;
  var g = $('<g>').attr('transform', 'translate('+shift+',0)');
  var sum = portals.reduce(function(a,b){ return a+b });
  var top = self.BAR_TOP;

  if(sum != 0) {
    for(var i=portals.length-1;i>=0;i--) {
      if(!portals[i])
        continue;
      var height = self.BAR_HEIGHT * portals[i] / sum;
      $('<rect>')
        .attr({
          x: 0,
          y: top,
          width: self.BAR_WIDTH,
          height: height,
          fill: COLORS_LVL[i]
        })
        .appendTo(g);
      top += height;
    }
  }

  $('<text>')
    .html(text)
    .attr({
      x: self.BAR_WIDTH * 0.5,
      y: self.BAR_TOP * 0.75,
      fill: color,
      'text-anchor': 'middle'
    })
    .appendTo(g);

  return g;
};

window.plugin.polyCounts2.makePie = function(startAngle, endAngle, color) {
  if(startAngle == endAngle)
    return $([]); // return empty element query

  var self = window.plugin.polyCounts2;
  var large_arc = (endAngle - startAngle) > 0.5 ? 1 : 0;

  var labelAngle = (endAngle + startAngle) / 2;
  var label = Math.round((endAngle - startAngle) * 100) + '%';

  startAngle = 0.5 - startAngle;
  endAngle   = 0.5 - endAngle;
  labelAngle = 0.5 - labelAngle;

  var p1x = Math.sin(startAngle * 2 * Math.PI) * self.RADIUS_INNER;
  var p1y = Math.cos(startAngle * 2 * Math.PI) * self.RADIUS_INNER;
  var p2x = Math.sin(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var p2y = Math.cos(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var lx  = Math.sin(labelAngle * 2 * Math.PI) * self.RADIUS_INNER / 1.5;
  var ly  = Math.cos(labelAngle * 2 * Math.PI) * self.RADIUS_INNER / 1.5;

  // for a full circle, both coordinates would be identical, so no circle would be drawn
  if(startAngle == 0.5 && endAngle == -0.5)
    p2x -= 1E-5;

  var text = $('<text>')
    .attr({
      'text-anchor': 'middle',
      'dominant-baseline' :'central',
      x: lx,
      y: ly
    })
    .html(label);

  var path = $('<path>')
    .attr({
      fill: color,
      d: self.format('M %s,%s A %s,%s 0 %s 1 %s,%s L 0,0 z', p1x,p1y, self.RADIUS_INNER,self.RADIUS_INNER, large_arc, p2x,p2y)
    });

  return path.add(text); // concat path and text
};

window.plugin.polyCounts2.makeRing = function(startAngle, endAngle, color) {
  var self = window.plugin.polyCounts2;
  var large_arc = (endAngle - startAngle) > 0.5 ? 1 : 0;

  startAngle = 0.5 - startAngle;
  endAngle   = 0.5 - endAngle;

  var p1x = Math.sin(startAngle * 2 * Math.PI) * self.RADIUS_OUTER;
  var p1y = Math.cos(startAngle * 2 * Math.PI) * self.RADIUS_OUTER;
  var p2x = Math.sin(endAngle   * 2 * Math.PI) * self.RADIUS_OUTER;
  var p2y = Math.cos(endAngle   * 2 * Math.PI) * self.RADIUS_OUTER;
  var p3x = Math.sin(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var p3y = Math.cos(endAngle   * 2 * Math.PI) * self.RADIUS_INNER;
  var p4x = Math.sin(startAngle * 2 * Math.PI) * self.RADIUS_INNER;
  var p4y = Math.cos(startAngle * 2 * Math.PI) * self.RADIUS_INNER;

  // for a full circle, both coordinates would be identical, so no circle would be drawn
  if(startAngle == 0.5 && endAngle == -0.5) {
    p2x -= 1E-5;
    p3x -= 1E-5;
  }

  return $('<path>')
    .attr({
      fill: color,
      d: self.format('M %s,%s ', p1x, p1y)
       + self.format('A %s,%s 0 %s 1 %s,%s ', self.RADIUS_OUTER,self.RADIUS_OUTER, large_arc, p2x,p2y)
       + self.format('L %s,%s ', p3x,p3y)
       + self.format('A %s,%s 0 %s 0 %s,%s ', self.RADIUS_INNER,self.RADIUS_INNER, large_arc, p4x,p4y)
       + 'Z'
    });
};

window.plugin.polyCounts2.format = function(str) {
  var re = /%s/;
  for(var i = 1; i < arguments.length; i++) {
    str = str.replace(re, arguments[i]);
  }
  return str;
};

window.plugin.polyCounts2.onPaneChanged = function(pane) {
  if(pane == 'plugin-polyCounts2')
    window.plugin.polyCounts2.getPortals();
  else
    $('#polyCounts2').remove()
};

var setup =  function() {
  window.plugin.polyCounts2.loadExternals();
  if(window.useAndroidPanes()) {
    android.addPane('plugin-polyCounts2', 'Poly counts', 'ic_action_data_usage');
    addHook('paneChanged', window.plugin.polyCounts2.onPaneChanged);
  } else {
    $('#toolbox').append(' <a onclick="window.plugin.polyCounts2.getPortals()" title="Display a summary of portals in the current view">Poly counts</a>');
  }

  $('head').append('<style>' +
    '#polyCounts2.mobile {background: transparent; border: 0 none !important; height: 100% !important; width: 100% !important; left: 0 !important; top: 0 !important; position: absolute; overflow: auto; z-index: 9000 !important; }' +
    '#polyCounts2 table {margin-top:5px; border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#polyCounts2 table td, #polyCounts2 table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#polyCounts2 table tr.res th {  background-color: #005684; }' +
    '#polyCounts2 table tr.enl th {  background-color: #017f01; }' +
    '#polyCounts2 table th { text-align: center;}' +
    '#polyCounts2 table td { text-align: center;}' +
    '#polyCounts2 table td.L0 { background-color: #000000 !important;}' +
    '#polyCounts2 table td.L1 { background-color: #FECE5A !important;}' +
    '#polyCounts2 table td.L2 { background-color: #FFA630 !important;}' +
    '#polyCounts2 table td.L3 { background-color: #FF7315 !important;}' +
    '#polyCounts2 table td.L4 { background-color: #E40000 !important;}' +
    '#polyCounts2 table td.L5 { background-color: #FD2992 !important;}' +
    '#polyCounts2 table td.L6 { background-color: #EB26CD !important;}' +
    '#polyCounts2 table td.L7 { background-color: #C124E0 !important;}' +
    '#polyCounts2 table td.L8 { background-color: #9627F4 !important;}' +
    '#polyCounts2 table td:nth-child(1) { text-align: left;}' +
    '#polyCounts2 table th:nth-child(1) { text-align: left;}' +
    '</style>');
};

// PLUGIN END //////////////////////////////////////////////////////////

// PLUGIN END
setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);

// PLUGIN END