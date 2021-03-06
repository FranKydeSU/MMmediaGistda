/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/leaflet/Layers';
import L from 'leaflet';

Layers.registerType('osm', (options) => {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="/terms">terms</a>',
        zoomOffset: options.zoomOffset || 0,
        maxNativeZoom: options.maxNativeZoom || 19,
        maxZoom: options.maxZoom || 23
    });
});
