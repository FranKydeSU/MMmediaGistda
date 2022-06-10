import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import assign from 'object-assign';
import { get } from 'lodash';
import axios from '../../libs/ajax';
import Rx from 'rxjs';
import uuidv1 from 'uuid/v1';
import { featureCollection } from '@turf/helpers';

import { createControlEnabledSelector } from '../../selectors/controls';
import { setControlProperty } from "../../actions/controls";
import { createSelector } from 'reselect';
import { Glyphicon } from 'react-bootstrap';
import Dialog from '../../components/misc/Dialog';
import LayerSelector from './mergelayer/LayerSelector';
import { groupsSelector, layersSelector } from '../../selectors/layers';
import { addLayer } from '../../actions/layers';

import { toCQLFilter } from '../../../client/utils/FilterUtils';

createControlEnabledSelector("mergelyr");

const mergeLayerSelector = (state) => get(state, 'controls.mergelyr.enabled');

// กรอง layer จาก groupNode
const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
};

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
            dispatch(fetchGeoJsonFailure('ERROR from getFeature Promise'))
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

// เพื่อกระจาย features ออกจาก features array ถ้าเป็น Annotation <- อาจมีอย่างอื่นด้วย เช่น Measurement
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

let layerTitle1 = '';
let layerTitle2 = '';
// let merged_id = 1;
const loadFeature = function (layerSelected1, layerSelected2) {
    layerTitle1 = layerSelected1.title || layerSelected1.name || undefined;
    layerTitle2 = layerSelected2.title || layerSelected2.name || undefined;
    // กรณีไม่เลือกครบ 2 layerใน LayerSelector dropdown
    if (!layerSelected1 || !layerSelected2) {
        layerSelected1 = {};
        layerSelected2 = {};
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Both layers didn\'t select'));
        }

        // กรณีชื่อ layer เหมือนกัน
    } else if (layerTitle1 === layerTitle2) {
        layerSelected1 = {};
        layerSelected2 = {};
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Both layers have same layer'));
        }
    }
    return (dispatch) => {
        const handleMerge = (canMerge, features1, features2) => {
            if (canMerge) {
                console.log('features1', features1);
                console.log('features2', features2);

                // check id เผื่อ mergedLayer มี layer_id เดียวกับ layer_id ที่จะ merge ด้วย
                // โดยเฉพาะ Annotation ไม่รู้ว่าเอาแยกออกมาเปลี่ยน id แล้วแต่ทำไม Annotation หลักถึงเปลี่ยน id ด้วย
                for (let i = 0; i < features1.length; i++) {
                    for (let j = 0; j < features2.length; j++) {
                        if (features1[i].id === features2[j].id) {
                            console.log(features1[i].id, features2[j].id)
                            dispatch(fetchGeoJsonFailure('Some layer has been in Layer already.'));
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
                dispatch(loadMergedLayer(mergedFeatures))
                dispatch(mergeAsLayer(mergedFeatures));
                dispatch(setLayer1(-1)); dispatch(setLayer2(-1));
                dispatch(loading(false));

            } else {
                dispatch(fetchGeoJsonFailure(`\'${features1[0].geometry.type}\' - \'${features2[0].geometry.type}\' type can't be merged`));
                dispatch(loading(false));
            }
        }

        dispatch(loading(true));
        dispatch(fetchGeoJsonFailure(''));
        // ทั้ง 2 layer มี feature ใน Client side อยู่แล้ว
        if (layerSelected1.features && layerSelected2.features) {
            let features1 = layerSelected1.features;
            let features2 = layerSelected2.features;
            if (layerTitle1 === 'Annotations') {
                features1 = spreadFeatures(layerSelected1);
            }
            if (layerTitle2 === 'Annotations') {
                features2 = spreadFeatures(layerSelected2);
            }
            console.log('features1, features2', features1, features2);
            handleMerge(checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                features1,
                features2
            );

            // layer ที่ 2 มี feature ใน Client side อยู่แล้ว
        } else if (!layerSelected1.features && layerSelected2.features) {
            getFeature(layerSelected1).then(featuresCollectionGeoJson1 => {
                let features1 = featuresCollectionGeoJson1.data.features;
                let features2 = layerSelected2.features;
                if (layerTitle2 === 'Annotations') {
                    features2 = spreadFeatures(layerSelected2);
                }
                console.log('features1, features2', features1, features2);
                handleMerge(checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                    features1,
                    features2,
                );
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure('ERROR in getFeature1'));
                dispatch(loading(false));
            })

            // layer ที่ 1 มี feature อยู่ใน Client side แล้ว
        } else if (layerSelected1.features && !layerSelected2.features) {
            console.log('Enter if 1 have features')
            getFeature(layerSelected2).then(featuresCollectionGeoJson2 => {
                let features1 = layerSelected1.features;;
                let features2 = featuresCollectionGeoJson2.data.features;
                if (layerTitle1 === 'Annotations') {
                    features1 = spreadFeatures({ ...layerSelected1 });
                }
                console.log('features1, features2', features1, features2);
                handleMerge(checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                    features1,
                    features2,
                );
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure('ERROR in getFeature2'));
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
                handleMerge(checkFeaturesTypeCondition(features1[0].geometry.type, features2[0].geometry.type),
                    features1,
                    features2
                );
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure('ERROR in Promise.all'));
                dispatch(loading(false));
            });
        }
    };
};

const selector = (state) => {
    return {
        layerIndex1: state.mergelyr.layerIndex1,
        layerIndex2: state.mergelyr.layerIndex2,
        loading: state.mergelyr.loading,
        error: state.mergelyr.error,
        mergedLayer: state.mergelyr.mergedLayer
    };
};

const MERGELYR_SET_LAYER_1 = "MERGELYR:SET_LAYER_1";
const MERGELYR_SET_LAYER_2 = "MERGELYR:SET_LAYER_2";
const MERGELYR_DO_MERGE = "MERGELYR:DO_MERGE";
const MERGELYR_SET_LOADING = "MERGELYR:SET_LOADING";
const MERGELYR_ADD_AS_LAYER = "MERGELYR:ADD_AS_LAYER";
const MERGELYR_FETCH_FAILURE = "MERGELYR:FETCH_FAILURE";
const MERGELYR_LOAD_MERGEDLAYER = "MERGELYR:LOAD_MERGELAYER";
// ค่าพิื้นฐานที่เรียกใช้คือ TOGGLE_CONTROL -> /reducers/controls.js
export const TOGGLE_CONTROL = 'TOGGLE_CONTROL';

const setLayer1 = function (idx) {
    return {
        type: MERGELYR_SET_LAYER_1,
        index1: idx
    };
};

const setLayer2 = function (idx) {
    return {
        type: MERGELYR_SET_LAYER_2,
        index2: idx
    };
};

const doMerge = function (layerSelected1, layerSelected2) {
    return {
        type: MERGELYR_DO_MERGE,
        layerSelected1,
        layerSelected2
    };
};

const loading = function (isLoading) {
    return {
        type: MERGELYR_SET_LOADING,
        isLoading
    };
};

const mergeAsLayer = function (featureCollection) {
    return {
        type: MERGELYR_ADD_AS_LAYER,
        featureCollection
    };
};

const fetchGeoJsonFailure = function (error) {
    return {
        type: MERGELYR_FETCH_FAILURE,
        error
    };
};

// const toggleMergeLyrTool = toggleControl.bind(null, "mergelyr", null);
const toggleMergeLyrTool = function () {
    return {
        type: TOGGLE_CONTROL,
        control: 'mergelyr',
        property: null,
        layerSelected1: {},
        layerSelected2: {},
        layerIndex1: -1,
        layerIndex2: -1,
        loading: false
    };
};

const loadMergedLayer = function (mergedLayer) {
    return {
        type: MERGELYR_LOAD_MERGEDLAYER,
        mergedLayer
    }
}

function mergeLayerReducer(state = defaultState, action) {
    switch (action.type) {
        case MERGELYR_SET_LAYER_1: {
            return assign({}, state, {
                layerIndex1: action.index1
            });
        };
        case MERGELYR_SET_LAYER_2: {
            return assign({}, state, {
                layerIndex2: action.index2
            });
        };
        case MERGELYR_SET_LOADING: {
            return assign({}, state, {
                loading: action.isLoading
            });
        };
        case MERGELYR_FETCH_FAILURE: {
            return assign({}, state, {
                error: action.error
            });
        };
        case TOGGLE_CONTROL: {
            return assign({}, state, {
                layerSelected1: action.layerSelected1,
                layerSelected2: action.layerSelected2,
                layerIndex1: action.layerIndex1,
                layerIndex2: action.layerIndex1,
                loading: action.loading
            });
        };
        case MERGELYR_LOAD_MERGEDLAYER: {
            return assign({}, state, {
                mergedLayer: action.mergedLayer
            })
        }
        default:
            return state;
    };
};

// epic ที่ไว้ดึง featureCollection จาก services โดย loadFeature function
const doMergeEpic = (action$, { getState = () => { } }) =>
    action$.ofType(MERGELYR_DO_MERGE)
        .filter(() => {
            return (getState().controls.mergelyr || {}).enabled || false;
        })
        .switchMap(({ layerSelected1, layerSelected2 }) => {
            return Rx.Observable.from([
                loadFeature(layerSelected1, layerSelected2)
            ]);
        });

// epic ที่นำ features ที่ merge แล้วเพิ่มใน layers panel ด้านซ้ายกับวาดลงแผนที่
const mergeAsLayerEpic = (action$) =>
    action$.ofType(MERGELYR_ADD_AS_LAYER)
        .switchMap(({ featureCollection }) => {
            console.log('==> mergeAsLayerEpic');
            console.log('featuresWantToAddLayer:', featureCollection);
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

const defaultState = {
    layerIndex1: -1,
    layerIndex2: -1,
    loading: false,
    error: ''
};

class MergeLayerComponent extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        layersNode: PropTypes.array,
        layersGroups: PropTypes.array,
        layerIndex1: PropTypes.number,
        layerIndex2: PropTypes.number,
        loading: PropTypes.bool,
        error: PropTypes.string,

        onDoMerge: PropTypes.func,
        onChangeLayer1: PropTypes.func,
        onChangeLayer2: PropTypes.func,
        onReset: PropTypes.func,
    }

    static defaultProps = {
        show: false,
        layersNode: [],
        layersGroups: [],
        layerIndex1: -1,
        layerIndex2: -1,
        loading: false,
        error: '',

        onDoMerge: () => { },
        onChangeLayer1: () => { },
        onChangeLayer2: () => { },
        onReset: () => { }
    }

    onClose = () => {
        this.props.onClose(false);
    };

    onChangeLayer1 = (idx) => {
        this.props.onChangeLayer1(idx);
    };

    onChangeLayer2 = (idx) => {
        this.props.onChangeLayer2(idx);
    };

    onDoMerge = () => {
        this.props.onDoMerge(this.props.layersNode[this.props.layerIndex1], this.props.layersNode[this.props.layerIndex2]);
    };

    onReset = () => {
        this.props.onChangeLayer1(-1);
        this.props.onChangeLayer2(-1);
    };

    onExportData = () => {
        let data = this.props.mergedLayer
        console.log('mergeFt', data)
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(data)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "data.json";

        link.click();
    };

    render() {
        return this.props.show ? (
            <Dialog Dialog id="measure-dialog" style={this?.dialogStyle} start={this?.start} >
                {console.log('ALL_LAYERS: ', this.props.allLayers)}
                <div key="header" role="header">
                    <Glyphicon glyph="folder-open" />&nbsp;Merge
                    <button key="close" onClick={this.onClose} className="close"><Glyphicon glyph="1-close" /></button>
                </div>
                <div key="body" role="body">
                    <p>Layer 1</p>
                    <LayerSelector
                        responses={this.props.layersNode}
                        index={this.props.layerIndex1}
                        setIndex={this.onChangeLayer1}
                    ></LayerSelector>
                    <br />
                    <p>Layer 2</p>
                    <LayerSelector
                        responses={this.props.layersNode}
                        index={this.props.layerIndex2}
                        setIndex={this.onChangeLayer2}
                    ></LayerSelector>
                    <br />
                    <div
                        style={{
                            display: "flex"
                        }}>

                        {
                            this.props.loading ?
                                <button
                                    key="mergelayer-merge"
                                    className="btn btn-longdo-outline-info"
                                    style={{ minWidth: "100px" }}
                                    disabled
                                >
                                    loading...
                                </button>
                                :
                                <button
                                    key="mergelayer-merge"
                                    // onClick={this?.onSearch}
                                    className="btn btn-longdo-outline-info"
                                    style={{ minWidth: "100px" }}
                                    // id="find-route"
                                    onClick={this.onDoMerge}
                                >
                                    Merge
                                </button>
                        }

                        <button
                            key="clear-mergelayer"
                            className="btn btn-longdo-outline"
                            style={{
                                minWidth: "90px",
                                marginRight: "5px",
                            }}
                            onClick={this.onReset}
                        >
                            Clear
                        </button>

                        <button
                            key="mergelayer-export"
                            className="btn btn-longdo-outline-info"
                            style={{ minWidth: "100px" }}
                            disabled={this.props.mergedLayer ? false : true}
                            onClick={this.onExportData}
                        >
                            Export
                        </button>

                        <p style={{ color: "red" }}>{this.props.error}</p>
                    </div>

                </div>
            </Dialog >
        ) : null
    }
}

const mergelyr = connect(
    createSelector(
        [
            selector,
            (state) => {
                return mergeLayerSelector(state);
            },
            groupsSelector,
            layersSelector
        ],
        (mergeLyrState, show, layersGroups, allLayers) => {
            return {
                ...mergeLyrState,
                show,
                layersGroups,
                layersNode: layerNodesExtracter(layersGroups),
                allLayers
            };
        }
    ),
    {
        onClose: toggleMergeLyrTool,
        onChangeLayer1: setLayer1,
        onChangeLayer2: setLayer2,
        onDoMerge: doMerge,
    },
    null,
    {
        pure: false,
    }
)(MergeLayerComponent);

export default {
    MergeLayerPlugin: assign(mergelyr, {
        BurgerMenu: {
            name: "mergelyr",
            position: 12,
            panel: false,
            help: "help",
            tooltip: "tooltip",
            text: "Merge",
            icon: <Glyphicon glyph="plus" />,
            action: () => setControlProperty("mergelyr", "enabled", true),
        },
    }),
    reducers: {
        mergelyr: mergeLayerReducer,
    },
    epics: {
        doMergeEpic,
        mergeAsLayerEpic,
    },
};