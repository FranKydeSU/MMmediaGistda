/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default {
    plugins: {
        // framework plugins
        DetailsPlugin: require('../plugins/Details').default,
        DrawerMenuPlugin: require('../plugins/DrawerMenu').default,
        FeedbackMaskPlugin: require('../plugins/FeedbackMask').default,
        GoFullPlugin: require('../plugins/GoFull').default,
        IdentifyPlugin: require('../plugins/Identify').default,
        LocatePlugin: require('../plugins/Locate').default,
        MapHeaderPlugin: require('./plugins/MapHeader').default,
        MapFooterPlugin: require('../plugins/MapFooter').default,
        MapLoadingPlugin: require('../plugins/MapLoading').default,
        MapPlugin: require('../plugins/Map').default,
        NearbyPlugin: require('./plugins/Nearby').default,
        FetchLayerPlugin: require('./plugins/FetchLayers').default,
        OmniBarPlugin: require('../plugins/OmniBar').default,
        RoutingPlugin: require('./plugins/Routing').default,
        SearchPlugin: require('../plugins/Search').default,
        TOCPlugin: require('../plugins/TOC').default,
        ToolbarPlugin: require('../plugins/Toolbar').default,
        ZoomAllPlugin: require('../plugins/ZoomAll').default,
        FullScreenPlugin: require('../plugins/FullScreen').default,
        MousePosition: require('../plugins/MousePosition').default,
        BufferPlugin: require('./plugins/Buffer').default, // FRANKY
        MergeLayerPlugin: require('./plugins/MergeLayer').default, // FRANKY
        ExportGeoJsonPlugin: require('./plugins/ExportGeoJson').default, // FRANKY
    },
    requires: {
        ReactSwipe: require('react-swipeable-views').default,

        SwipeHeader: require('../components/data/identify/SwipeHeader').default
    }
};
