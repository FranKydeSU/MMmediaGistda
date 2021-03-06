/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/openlayers/Layers';
import React from 'react';
import {transform} from 'ol/proj';

let layersMap;
let rendererItem;
let gmaps = {};
let isTouchSupported = 'ontouchstart' in window;
let startEvent = isTouchSupported ? 'touchstart' : 'mousedown';
let moveEvent = isTouchSupported ? 'touchmove' : 'mousemove';
let endEvent = isTouchSupported ? 'touchend' : 'mouseup';


function getGMapsLib() {
    return window?.google?.maps;
}
Layers.registerType('google', {
    create: (options, map, mapId) => {
        if (document.getElementById(mapId + 'gmaps')) {
            let gMapsLib = getGMapsLib();
            if (!gMapsLib) {
                return null;
            }
            if (!layersMap) {
                layersMap = {
                    'HYBRID': gMapsLib.MapTypeId.HYBRID,
                    'SATELLITE': gMapsLib.MapTypeId.SATELLITE,
                    'ROADMAP': gMapsLib.MapTypeId.ROADMAP,
                    'TERRAIN': gMapsLib.MapTypeId.TERRAIN
                };
            }
            if (!gmaps[mapId]) {
                gmaps[mapId] = new gMapsLib.Map(document.getElementById(mapId + 'gmaps'), {
                    disableDefaultUI: true,
                    keyboardShortcuts: false,
                    draggable: false,
                    disableDoubleClickZoom: true,
                    scrollwheel: false,
                    streetViewControl: false,
                    minZoom: options.minZoom,
                    maxZoom: options.maxZoom
                });
            }
            gmaps[mapId].setMapTypeId(layersMap[options.name]);
            let mapContainer = document.getElementById(mapId + 'gmaps');
            let setCenter = function() {
                if (gmaps[mapId] && mapContainer.style.visibility !== 'hidden') {
                    const center = transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
                    gmaps[mapId].setCenter(new gMapsLib.LatLng(center[1], center[0]));
                }
            };
            let setZoom = function() {
                if (gmaps[mapId] && mapContainer.style.visibility !== 'hidden') {
                    gmaps[mapId].setZoom(map.getView().getZoom());
                }
            };

            /**
             * @param point {array}: [x, y]
             * @param alpha {number}: rotation in degrees
             */
            let rotatePoint = function(point, alpha) {
                const radAlpha = alpha * Math.PI / 180;
                const x = point[0];
                const y = point[1];

                let rx = x * Math.cos(radAlpha) - y * Math.sin(radAlpha);
                let ry = x * Math.sin(radAlpha) + y * Math.cos(radAlpha);

                return [rx, ry];
            };

            /**
             * @param rotation {number}: rotation in degrees
             * @param size {array}: map size [w, h]
             */
            let calculateRotatedSize = function(rotation, size) {
                let w = size[0];
                let h = size[1];

                let vertices = [
                    //  [   x  ,   y  ]
                    [w / 2, h / 2],
                    [-w / 2, h / 2],
                    [-w / 2, -h / 2],
                    [w / 2, -h / 2]
                ];

                let rVertices = vertices.map(function(p) { return rotatePoint(p, rotation); });

                let Xs = rVertices.map(function(p) { return p[0]; });
                let Ys = rVertices.map(function(p) { return p[1]; });

                let maxX = Math.max.apply(null, Xs);
                let minX = Math.min.apply(null, Xs);
                let maxY = Math.max.apply(null, Ys);
                let minY = Math.min.apply(null, Ys);

                let H = Math.abs(maxY) + Math.abs(minY);
                let W = Math.abs(maxX) + Math.abs(minX);

                return { width: W, height: H };
            };

            let setRotation = function() {
                if (mapContainer.style.visibility !== 'hidden') {
                    const rotation = map.getView().getRotation() * 180 / Math.PI;

                    mapContainer.style.transform = "rotate(" + rotation + "deg)";
                    gMapsLib.event.trigger(gmaps[mapId], "resize");
                }
            };

            let setViewEventListeners = function() {
                let view = map.getView();
                view.on('change:center', setCenter);
                view.on('change:resolution', setZoom);
                view.on('change:rotation', setRotation);
            };
            map.on('change:view', setViewEventListeners);

            setViewEventListeners();
            setCenter();
            setZoom();

            let viewport = map.getViewport();
            let oldTrans = document.getElementById(mapId + 'gmaps').style.transform;

            let mousedown = false;
            let mousemove = false;

            let resizeGoogleLayerIfRotated = function() {
                let degrees = /[\+\-]?\d+\.?\d*/i;
                let newTrans = document.getElementById(mapId + 'gmaps').style.transform;
                if (gmaps[mapId] && newTrans !== oldTrans && newTrans.indexOf('rotate') !== -1) {
                    let rotation = parseFloat(newTrans.match(degrees)[0]);
                    let size = calculateRotatedSize(-rotation, map.getSize());
                    mapContainer.style.width = size.width + 'px';
                    mapContainer.style.height = size.height + 'px';
                    mapContainer.style.left = Math.round((map.getSize()[0] - size.width) / 2.0) + 'px';
                    mapContainer.style.top = Math.round((map.getSize()[1] - size.height) / 2.0) + 'px';
                    gMapsLib.event.trigger(gmaps[mapId], "resize");
                    setCenter();
                }
            };

            viewport.addEventListener(startEvent, () => {
                mousedown = true;
            });
            viewport.addEventListener(endEvent, () => {
                if (mousemove && mousedown) {
                    resizeGoogleLayerIfRotated();
                }
                oldTrans = document.getElementById(mapId + 'gmaps').style.transform;
                mousedown = false;
            });
            viewport.addEventListener(moveEvent, () => {
                mousemove = mousedown;
            });
        }
        return null;
    },
    render(options, map, mapId) {
        // the first item that call render will take control
        if (!rendererItem) {
            rendererItem = options.name;
        }
        let gmapsStyle = {zIndex: 0};
        if (options.visibility === true) {
            let div = document.getElementById(mapId + "gmaps");
            if (div) {
                div.style.visibility = 'visible';
            }
            if (gmaps[mapId] && layersMap) {
                gmaps[mapId].setMapTypeId(layersMap[options.name]);
                gmaps[mapId].setTilt(0);
            }
        } else {
            gmapsStyle.visibility = 'hidden'; // used only for the renered div
        }
        // To hide the map when visibility is set to false for every
        // instance of google layer
        if (rendererItem === options.name) {
            // assume the first render the div for gmaps
            let div = document.getElementById(mapId + "gmaps");
            if (div) {
                div.style.visibility = options.visibility ? 'visible' : 'hidden';
            }
            return <div id={mapId + "gmaps"} className="fill" style={gmapsStyle} />;
        }
        return null;
    },
    update(layer, newOptions, oldOptions, map, mapId) {
        if (!gmaps[mapId]) {
            return;
        }
        let gMapsLib = getGMapsLib();

        if (!oldOptions.visibility && newOptions.visibility) {
            let view = map.getView();
            const center = transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
            gmaps[mapId].setCenter(new gMapsLib.LatLng(center[1], center[0]));
            gmaps[mapId].setZoom(view.getZoom());
        }
        if (!oldOptions.minZoom && newOptions.minZoom) {
            gmaps[mapId].setOptions({ minZoom: newOptions.minZoom });
        }
        if (!oldOptions.maxZoom && newOptions.maxZoom) {
            gmaps[mapId].setOptions({ maxZoom: newOptions.maxZoom });
        }
    },
    remove(options, map, mapId) {
        if (rendererItem === options.name) {
            rendererItem = undefined;
            delete gmaps[mapId];
        }
    }
});
