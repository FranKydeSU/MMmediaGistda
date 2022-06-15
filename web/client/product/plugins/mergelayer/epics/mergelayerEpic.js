import React from "react";
import axios from "../../../../libs/ajax";
import Rx from "rxjs";
import uuidv1 from "uuid/v1";
import { toCQLFilter } from "../../../../../client/utils/FilterUtils";
import Message from "../../../../components/I18N/Message";
import { addLayer } from '../../../../actions/layers';
// Actions
import {
    MERGELYR_DO_MERGE,
    MERGELYR_ADD_AS_LAYER,
    fetchGeoJsonFailure,
    loading,
    setLayer1,
    setLayer2,
    mergeAsLayer,
} from '../actions/mergelayer'

const getFeature = (layerSelected) => {
    const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
    return new Promise((resolve, reject) => {
        let params = {
            service: 'WFS',
            version: layerSelected.version,
            request: 'GetFeature',
            typeName: layerSelected.name,
            outputFormat: 'application/json',
        };
        // สำหรับ layer ที่มีการ filter จะมี layerFilter อยู่ใน obj
        if (layerSelected.layerFilter) {
            const cql_filter = toCQLFilter(layerSelected?.layerFilter);
            console.log('cql_filter', cql_filter);
            params.cql_filter = cql_filter;
        }
        let getFromAPI = axios.get(`${layerSelected.url || DEFAULT_API}`, { params });
        resolve(getFromAPI);
        reject((dispatch) => {
            dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.errorFetch" />))
        });
    })
}

// checkFeaturesTypeCondition คือ Check ว่า 2 layer type นี้สามารถ merge ได้หรือไม่ โดนเงื่อนไขอยู่ภายใน array นี้
const checkFeaturesTypeCondition = (type1, type2) => {
    console.log('type1, type2', type1.toLowerCase(), type2.toLowerCase())
    let featuresTypeCondition = [
        ['point', 'point'],
        ['linestring', 'linestring'],
        ['polygon', 'polygon'],
        ['multipoint', 'multipoint'],
        ['multilinestring', 'multilinestring'],
        ['multipolygon', 'multipolygon'],

        ['point', 'multipoint'],
        ['multipoint', 'point'],

        ['multilinestring', 'linestring'],
        ['linestring', 'multilinestring'],

        ['multipolygon', 'polygon'],
        ['polygon', 'multipolygon'],
    ];
    for (let i = 0; i < featuresTypeCondition.length; i++) {
        if (featuresTypeCondition[i][0] === type1?.toLowerCase() && featuresTypeCondition[i][1] === type2?.toLowerCase()) {
            return true;
        }
    }
    return false;
}

// เพื่อกระจาย features ออกจาก features array ถ้าเป็น Annotation features <- อาจมีอย่างอื่นด้วย เช่น Measurement
const spreadFeatures = (layerSelected) => {
    var newGeojson = JSON.parse(JSON.stringify(layerSelected))
    let featuresArray = [];
    for (let i = 0; i < newGeojson.features.length; i++) {
        for (let j = 0; j < newGeojson.features[i].features.length; j++) {
            featuresArray.push(newGeojson.features[i].features[j])
        }
    }
    featuresArray.forEach((feature) => delete feature.style)
    console.log('spreadFeatures: ', featuresArray);
    return featuresArray;
}

// เพื่อเอาไปใช้ต่อกับ mergeAsLayerEpic
let layerTitle1 = '';
let layerTitle2 = '';
const loadFeature = function (layerSelected1, layerSelected2) {
    console.log('layerSelected1', layerSelected1)
    console.log('layerSelected2', layerSelected2)
    layerTitle1 = layerSelected1?.title || layerSelected1?.name || undefined;// ERROR!
    layerTitle2 = layerSelected2?.title || layerSelected2?.name || undefined;
    console.log('layerTitle1', layerTitle1)
    console.log('layerTitle2', layerTitle2)
    // กรณีไม่เลือกครบ 2 layerใน LayerSelector dropdown
    if (!layerSelected1 || !layerSelected2) {
        layerSelected1 = {};
        layerSelected2 = {};
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.noBothLayers" />));
        }

        // กรณีชื่อ layer เหมือนกัน
    } else if (layerTitle1 === layerTitle2) {
        layerSelected1 = {};
        layerSelected2 = {};
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.sameLayers" />));
        }
    }
    return (dispatch) => {
        const handleMerge = (canMerge, features1, features2) => {
            if (canMerge) {
                console.log('features1', features1);
                console.log('features2', features2);

                // check id เผื่อ mergedLayer มี layer_id เดียวกับ layer_id ที่จะ merge ด้วย
                for (let i = 0; i < features1.length; i++) {
                    for (let j = 0; j < features2.length; j++) {
                        if (features1[i].id === features2[j].id) {
                            console.log(features1[i].id, features2[j].id)
                            dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.haveLayerAlready" />));
                            dispatch(loading(false));
                            return;
                        }
                    }
                }

                let mergedFeatures = {
                    type: 'FeatureCollection',
                    features: [...features1, ...features2]
                }
                console.log('mergedFeatures', mergedFeatures)
                dispatch(mergeAsLayer(mergedFeatures));
                dispatch(fetchGeoJsonFailure("succeed"));
                dispatch(setLayer1(-1)); dispatch(setLayer2(-1));dispatch(loading(false));

            } else {
                dispatch(fetchGeoJsonFailure(
                    `\'${features1[0].geometry.type}\' - \'${features2[0].geometry.type}\' type can't be merged`
                ));
                dispatch(loading(false));
            }
        }

        dispatch(loading(true));
        dispatch(fetchGeoJsonFailure(''));
        // ทั้ง 2 layer มี feature ใน Client side อยู่แล้ว
        if (layerSelected1.features && layerSelected2.features) {
            let features1 = layerSelected1.features;
            let features2 = layerSelected2.features;
            if (layerTitle1 === 'Annotations') 
                features1 = spreadFeatures(layerSelected1);
            if (layerTitle2 === 'Annotations') 
                features2 = spreadFeatures(layerSelected2);

            console.log('features1, features2', features1, features2);
            handleMerge(
                checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                features1,
                features2
            );

            // layer ที่ 2 มี feature ใน Client side อยู่แล้ว
        } else if (!layerSelected1.features && layerSelected2.features) {
            getFeature(layerSelected1).then(featuresCollectionGeoJson1 => {
                let features1 = featuresCollectionGeoJson1.data.features;
                let features2 = layerSelected2.features;
                if (layerTitle2 === 'Annotations') 
                    features2 = spreadFeatures(layerSelected2);
                
                console.log('features1, features2', features1, features2);
                handleMerge(
                    checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                    features1,
                    features2,
                );
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.errorGetFeature1" />));
                dispatch(loading(false));
            })

            // layer ที่ 1 มี feature อยู่ใน Client side แล้ว
        } else if (layerSelected1.features && !layerSelected2.features) {
            getFeature(layerSelected2).then(featuresCollectionGeoJson2 => {
                let features1 = layerSelected1.features;;
                let features2 = featuresCollectionGeoJson2.data.features;
                if (layerTitle1 === 'Annotations') 
                    features1 = spreadFeatures(layerSelected1);
                
                console.log('features1, features2', features1, features2);
                handleMerge(
                    checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                    features1,
                    features2,
                );
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.errorGetFeature2" />));
                dispatch(loading(false));
            })

            // ทั้ง 2 layer ยังไม่มี feature ใน Client side (ติดปัญหา delay หรือ catch มากที่สุด)
        } else {
            let getFeature1 = getFeature(layerSelected1);
            let getFeature2 = getFeature(layerSelected2);
            Promise.all([getFeature1, getFeature2]).then(featuresCollectionGeoJsons => {
                let features1 = featuresCollectionGeoJsons[0].data.features;
                let features2 = featuresCollectionGeoJsons[1].data.features;
                console.log('features1, features2', features1, features2);
                handleMerge(
                    checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                    features1,
                    features2
                );
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure(<Message msgId="mergeLayerPlugin.errorAllGetFeature" />));
                dispatch(loading(false));
            });
        }
    };
};
// epic ที่ไว้ดึง featureCollection จาก services โดย loadFeature function
export const doMergeEpic = (action$, { getState = () => { } }) =>
    action$.ofType(MERGELYR_DO_MERGE)
        .filter(() => {
            return (getState().controls.mergelyr || {}).enabled || false;
        })
        .switchMap(({ layerSelected1, layerSelected2 }) => {
            return Rx.Observable.from([
                loadFeature(layerSelected1, layerSelected2)
            ])
        });
// epic ที่นำ features ที่ merge แล้วเพิ่มใน layers panel ด้านซ้ายกับวาดลงแผนที่
export const mergeAsLayerEpic = (action$) =>
    action$.ofType(MERGELYR_ADD_AS_LAYER)
        .switchMap(({ featureCollection }) => {
            console.log('==> mergeAsLayerEpic');
            console.log('layer add to panel:', featureCollection);
            return Rx.Observable.of(
                addLayer({
                    type: 'vector',
                    id: uuidv1(),
                    name: 'MergeLayer',
                    hideLoading: true,
                    features: [...featureCollection.features],
                    visibility: true,
                    title: 'Merged_(' + layerTitle1 + '&' + layerTitle2 + ')'
                })
            );
        });