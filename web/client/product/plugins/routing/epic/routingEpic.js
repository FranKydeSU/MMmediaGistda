import Rx from "rxjs";
import uuidv1 from "uuid/v1";
import { changeDrawingStatus } from "../../../../actions/draw";
import { zoomToExtent } from "../../../../actions/map";

import {
    searchPointForRouting
} from '../actions/routing'

export const routingResultLoadedEpic = (action$, { getState = () => { } }) =>
    action$
        .ofType("ROUTING_FEATURE_LOADED")
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ features }) => {
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: true,
                translateEnabled: false,
                drawEnabled: false,
                // useSelectedStyle: true
            };

            const style = {
                highlight: false,
            };
            let locationList = [];
            features.forEach((f) => {
                locationList = locationList.concat(
                    f.geometry.coordinates.map((c) => {
                        return {
                            lat: c[1],
                            lon: c[0],
                        };
                    })
                );
            });
            let featuresFormat = features.map((feature) => {
                feature.properties = {
                    ...feature.properties,
                    id: uuidv1(),
                    isValidFeature: true,
                    canEdit: false,
                };
                if (feature.geometry.type === "LineString") {
                    feature.style = [
                        {
                            color: "#006994",
                            opacity: 1,
                            weight: 4,
                            editing: {
                                fill: 1,
                            },
                            highlight: false,
                            id: uuidv1(),
                        },
                    ];
                }
                return feature;
            });
            const bbox = window.longdo.Util.locationBound(locationList);
            const featureCollection = [
                {
                    type: "FeatureCollection",
                    newFeature: true,
                    id: uuidv1(),
                    geometry: null,
                    properties: uuidv1(),
                    features: [...featuresFormat],
                },
            ];
            return Rx.Observable.from([
                changeDrawingStatus("clean", "", "routingResult", [], {}),
                changeDrawingStatus(
                    "drawOrEdit",
                    "LineString",
                    "routingResult",
                    featureCollection,
                    drawOptions,
                    style
                ),
                zoomToExtent(
                    [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat],
                    "EPSG:4326",
                    10,
                    { nearest: true }
                ),
            ]);
        });
export const clearRoutingResult = (action$, { getState = () => { } }) =>
    action$
        .ofType("ROUTING_FEATURE_CLEAR")
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(() => {
            return Rx.Observable.from([
                changeDrawingStatus("clean", "", "routingResult", [], {}),
            ]);
        });
export const routingClickGuideEpic = (action$, { getState = () => { } }) =>
    action$
        .ofType("ROUTING_CLICK_GUIDE")
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ value }) => {
            console.log(value);

            let locationList = value.geometry.coordinates.map((c) => {
                return {
                    lat: c[1],
                    lon: c[0],
                };
            });
            const bbox = window.longdo.Util.locationBound(locationList);

            return Rx.Observable.from([
                // zoomToPoint(
                zoomToExtent(
                    [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat],
                    "EPSG:4326",
                    16,
                    { nearest: true }
                ),
            ]);
        });
export const onSwapRoutingEpic = (action$, { getState = () => { } }) =>
    action$
        .ofType("ROUTING_SWAP_POINT")
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ }) => {
            const pointList = getState().pointList;
        });

export const routingChangePointInputEpic = (action$, { getState = () => { } }) =>
    action$
        .ofType("ROUTING_CHANGE_POINT_LIST")
        .debounceTime(300)
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ index, value }) => {
            const center = getState().map.present.center;
            return Rx.Observable.from([
                searchPointForRouting(index, value, center),
            ]);
        });
