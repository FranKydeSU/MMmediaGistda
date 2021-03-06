/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/leaflet/Layers';
import L from 'leaflet';
import 'leaflet.gridlayer.googlemutant';
function getGMapsLib() {
    return window?.google?.maps;
}
Layers.registerType('google', (options) => {
    if (!getGMapsLib()) {
        return null;
    }
    return L.gridLayer.googleMutant({
        type: options.name.toLowerCase(),
        maxNativeZoom: options.maxNativeZoom || 18,
        maxZoom: options.maxZoom || 20});
});
