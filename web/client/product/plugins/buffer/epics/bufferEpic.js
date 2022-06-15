import React from "react";
import Rx from "rxjs";
import uuidv1 from "uuid/v1";
import { addLayer } from "../../../../actions/layers";
import Message from '../../../../components/I18N/Message';
import { toCQLFilter } from "../../../../../client/utils/FilterUtils";
import turfBuffer from "@turf/buffer";
import axios from "../../../../libs/ajax";
import { featureCollection } from "@turf/helpers";
// Actions
import {
    BUFFER_DO_BUFFER,
    BUFFER_ADD_AS_LAYER,
    loading,
    addAsLayer,
    fetchGeoJsonFailure,
    setLayer,
    setRadius
} from '../actions/buffer'

// เพื่อกระจาย features ออกจาก features array ถ้าเป็น Annotation features <- อาจมีอย่างอื่นด้วย เช่น Measurement
const spreadFeatures = (layerSelected) => {
    let featuresArray = [];
    for (let i = 0; i < layerSelected.features.length; i++) {
        for (let j = 0; j < layerSelected.features[i].features.length; j++) {
            featuresArray.push(layerSelected.features[i].features[j]);
        }
    }
    console.log("spreadFeatures: ", featuresArray);
    return featuresArray;
};

let layerTitle = ""; // เพื่อเอาไปใช้ต่อกับ addAsBufferedLayerEpic
const loadFeature = function (layerSelected) {
    if (!layerSelected) {
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure(<Message msgId="bufferPlugin.noLayer" />));
        };
    }
    return (dispatch, getState) => {
        const handleUnit = (radius, unit) => {
            if (radius <= 0) {
                dispatch(fetchGeoJsonFailure(<Message msgId="bufferPlugin.errorLessThan1" />));
                dispatch(loading(false));
                return;
            }
            // Check Unit | โดยปกติ turf จะสามารถใช้หน่วย kilometers / miles / degrees
            switch (unit) {
                case "meters":
                    radius /= 1000;
                    unit = "kilometers";
                    break;
                case "วา":
                    radius /= 500;
                    unit = "kilometers";
                    break;
                default:
                    radius;
                    unit;
            }
            return [radius, unit];
        };

        const bufferWithTurf = (featuresCollectionGeoJson) => {
            let radiusAndUnit = handleUnit(
                getState().buffer.radius,
                getState().buffer.unitValue
            );
            console.log('radiusAndUnit', radiusAndUnit);
            if (radiusAndUnit === undefined) return;
            // เก็บ id เอาไว้ใน array เพราะถ้า Turf แล้ว id จะหาย
            let featuresIdTemp = [];
            featuresCollectionGeoJson.features.forEach((feature) => {
                if (feature.id)
                    featuresIdTemp.push(feature.id);
                else if (feature.properties.id) // For Annotation or etc.
                    featuresIdTemp.push(feature.properties.id);
            });
            let result = turfBuffer(
                featuresCollectionGeoJson,
                radiusAndUnit[0],
                { units: radiusAndUnit[1] }
            );
            // ใส่ id ที่อยู่ใน array กลับเข้าไป
            result.features.forEach((feature, i) => {
                feature.id = "buffered_" + featuresIdTemp[i];
                if (feature.properties.id) // For Annotation or etc.
                    feature.properties.id = "buffered_" + featuresIdTemp[i];
            });
            return result;
        }

        dispatch(loading(true));
        layerTitle = layerSelected.title || layerSelected.name;

        // ถ้า layer นี้มี features ใน Client Side
        if (layerSelected.features) {
            console.log("layerTitle", layerTitle);
            let featuresGeoJson;
            if (layerTitle === "Annotations")
                featuresGeoJson = spreadFeatures(layerSelected);
            else
                featuresGeoJson = layerSelected.features;

            let featuresCollectionGeoJson = featureCollection(featuresGeoJson);
            let result = bufferWithTurf(featuresCollectionGeoJson);
            console.log('result of turf', result)
            if (result === undefined) return;

            dispatch(addAsLayer(result));
            dispatch(fetchGeoJsonFailure("succeed"));
            dispatch(setLayer(-1)); dispatch(loading(false)); dispatch(setRadius(1));

        } else { // ถ้าไม่มี features layer อยู่ใน client จะทำการ get
            const DEFAULT_API = "https://geonode.longdo.com/geoserver/wfs";
            new Promise((resolve, reject) => {
                let params = {
                    service: "WFS",
                    version: layerSelected.version,
                    request: "GetFeature",
                    typeName: layerSelected.name,
                    outputFormat: "application/json",
                };
                // สำหรับ layer ที่มีการ filter จะมี layerFilter อยู่ใน obj
                if (layerSelected.layerFilter) {
                    const cql_filter = toCQLFilter(layerSelected?.layerFilter);
                    console.log("cql_filter", cql_filter);
                    params.cql_filter = cql_filter;
                }
                let getFromAPI = axios.get(`${layerSelected.url || DEFAULT_API}`, { params });
                resolve(getFromAPI);
            })
                .then((featuresCollectionGeoJson) => {
                    let featuresCollectionData = featuresCollectionGeoJson.data;
                    console.log("featuresCollectionData", featuresCollectionData);

                    let result = bufferWithTurf(featuresCollectionData)
                    console.log('result', result)
                    if (result === undefined) return;

                    dispatch(addAsLayer(result));
                    dispatch(fetchGeoJsonFailure("succeed"));
                    dispatch(setLayer(-1)); dispatch(loading(false)); dispatch(setRadius(1));
                })
                .catch((e) => {
                    console.log(e);
                    dispatch(loading(false));
                    dispatch(fetchGeoJsonFailure(<Message msgId="bufferPlugin.errorFetch" />));
                });
        }
    };
};

// epic ที่ไว้ดึง featuresCollection จาก services โดย loadFeature function
export const doBufferEpic = (action$, { getState = () => { } }) =>
    action$.ofType(BUFFER_DO_BUFFER)
        .filter(() => {
            return (getState().controls.buffer || {}).enabled || false;
        })
        .switchMap(({ layerSelected }) => {
            return Rx.Observable.from([loadFeature(layerSelected)]);
        });

// epic ที่ buffer แล้วมาเพิ่มใน layers panel ด้านซ้ายกับวาดลงแผนที่
export const addAsBufferedLayerEpic = (action$) =>
    action$.ofType(BUFFER_ADD_AS_LAYER)
        .switchMap(({ bufferedFtCollection }) => {
            console.log("==> addAsLayerEpic");
            console.log("bufferedLayer in epic:", bufferedFtCollection);
            return Rx.Observable.of(
                addLayer({
                    type: "vector",
                    id: uuidv1(),
                    name: "BufferedLayer",
                    hideLoading: true,
                    features: [...bufferedFtCollection.features],
                    visibility: true,
                    title: "Buffered_" + layerTitle,
                })
            );
        });