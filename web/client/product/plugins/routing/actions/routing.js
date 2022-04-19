const LONGDO_API_KEY = "98034a5f21623ae53d3802af7b86fddf";
const axios = require("axios");
const instance = axios.create();

import { routePointStyle } from "../styles/pointStyle";

// ROUTEING ACTION
export const addPoint = function () {
    return {
        type: "ROUTING_ADD_POINT",
    };
};
export const removePoint = (index) => {
    return {
        type: "ROUTING_REMOVE_POINT",
        index: index,
    };
};
export const swapPoint = function () {
    return {
        type: "ROUTING_SWAP_POINT",
    };
};
export const clearSearchRouting = function (props) {
    return {
        type: "ROUTING_FEATURE_CLEAR",
        features: props.features,
    };
};
export const changePointInput = function (index, value) {
    return {
        type: "ROUTING_CHANGE_POINT_LIST",
        index: index,
        value: value,
    };
};
export const clickGuide = function (value) {
    return {
        type: "ROUTING_CLICK_GUIDE",
        value: value,
    };
};
export const clickSearchResult = function (i, j, result) {
    return {
        type: "ROUTING_CLICK_SEARCH_RESULT",
        i,
        j,
        result,
    };
};

export const changeRouteMode = function (value) {
    return {
        type: "ROUTING_CHANGE_MODE",
        value: value
    };
}

export const changeRouteType = function (value) {
    return {
        type: 'ROUTING_CHANGE_TYPE',
        value: value
    }
}

export const displaySetting = function () {
    return {
        type: "ROUTING_DISPLAY_SETTING",
    };
}

// Search
export const searchRouting = (pointList,routeMode,routeType) => {
    return (dispatch) => {
        let geoJsonData = new Promise((resolve, reject) => {
            setTimeout(() => {
                let getRoutePath = instance.get(
                    "https://api.longdo.com/RouteService/geojson/route",
                    {
                        params: {
                            flon: pointList[0].lon,
                            flat: pointList[0].lat,
                            tlon: pointList[1].lon,
                            tlat: pointList[1].lat,
                            locale: "th",
                            mode: routeMode,
                            type: routeType.toString() || '',
                            key: LONGDO_API_KEY,
                        },
                    }
                );
                resolve(getRoutePath);
            }, 2000);
        });
        geoJsonData.then((value) => {
            let routeGeoJson = value.data.features;
            let routeLengthObj = routeGeoJson.length;
            let lastRouteCoordinates =
                routeGeoJson[routeLengthObj - 1].geometry.coordinates.length;
            let lastRouteLon =
                routeGeoJson[routeLengthObj - 1].geometry.coordinates[
                lastRouteCoordinates - 1
                ][0];
            let lastRouteLat =
                routeGeoJson[routeLengthObj - 1].geometry.coordinates[
                lastRouteCoordinates - 1
                ][1];
            if (pointList.length === 2) {
                routeGeoJson.push({
                    type: "Feature",
                    style: [routePointStyle("START")],
                    geometry: {
                        type: "Point",
                        coordinates: [
                            routeGeoJson[0].geometry.coordinates[0][0],
                            routeGeoJson[0].geometry.coordinates[0][1],
                        ],
                    },
                });
                routeGeoJson.push({
                    type: "Feature",
                    style: [routePointStyle("END")],
                    geometry: {
                        type: "Point",
                        coordinates: [lastRouteLon, lastRouteLat],
                    },
                });
                dispatch(featureLoaded(routeGeoJson));
                document.getElementById("find-route").innerHTML =
                    "ค้นหาเส้นทาง";
            } else {
                routeGeoJson.push({
                    type: "Feature",
                    style: [routePointStyle("START")],
                    geometry: {
                        type: "Point",
                        coordinates: [
                            routeGeoJson[0].geometry.coordinates[0][0],
                            routeGeoJson[0].geometry.coordinates[0][1],
                        ],
                    },
                });
                routeGeoJson.push({
                    type: "Feature",
                    style: [routePointStyle("START")],
                    geometry: {
                        type: "Point",
                        coordinates: [lastRouteLon, lastRouteLat],
                    },
                });
                for (let i = 2; i < pointList.length; i++) {
                    const getMoreGeoJsonData = new Promise(
                        (resolve, reject) => {
                            setTimeout(() => {
                                let getRoutePath = instance.get(
                                    "https://api.longdo.com/RouteService/geojson/route",
                                    {
                                        params: {
                                            flon: lastRouteLon,
                                            flat: lastRouteLat,
                                            tlon: pointList[i].lon,
                                            tlat: pointList[i].lat,
                                            locale: "th",
                                            mode: routeMode,
                                            type: routeType.toString() || '',
                                            key: LONGDO_API_KEY,
                                        },
                                    }
                                );
                                resolve(getRoutePath);
                            }, 2000);
                        }
                    );
                    getMoreGeoJsonData.then((value) => {
                        lastRouteCoordinates =
                            value.data.features[value.data.features.length - 1]
                                .geometry.coordinates.length;
                        lastRouteLon =
                            value.data.features[value.data.features.length - 1]
                                .geometry.coordinates[
                            lastRouteCoordinates - 1
                            ][0];
                        lastRouteLat =
                            value.data.features[value.data.features.length - 1]
                                .geometry.coordinates[
                            lastRouteCoordinates - 1
                            ][1];
                        routeGeoJson.push({
                            type: "Feature",
                            style: [routePointStyle("START")],
                            geometry: {
                                type: "Point",
                                coordinates: [lastRouteLon, lastRouteLat],
                            },
                        });
                        routeGeoJson.push(...value.data.features);
                        if (i + 1 === pointList.length) {
                            dispatch(featureLoaded(routeGeoJson));
                            document.getElementById("find-route").innerHTML =
                                "ค้นหาเส้นทาง";
                        }
                    });
                }
            }
        });
    };
};
export const searchPointForRouting = function (index, value, center) {
    return (dispatch) => {
        return instance
            .get(
                `https://search.longdo.com/mapsearch/json/search?lat=${center.x}&lon=${center.y}&keyword=${value}&locale=th&key=${LONGDO_API_KEY}`
            )
            .then((response) => {
                dispatch(searchLoaded(index, response.data));
            });
    };
};

// Load data
export const searchLoaded = function (index, result) {
    return {
        type: "ROUTING_SEARCH_LOADED",
        index: index,
        result: result,
    };
};
export const featureLoaded = function (features) {
    return {
        type: "ROUTING_FEATURE_LOADED",
        features: features,
    };
};


