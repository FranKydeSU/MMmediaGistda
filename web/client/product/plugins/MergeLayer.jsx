import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import assign from 'object-assign';
import { get } from 'lodash';
import axios from '../../libs/ajax';
import Rx from 'rxjs';
import uuidv1 from 'uuid/v1';
import { featureCollection } from '@turf/helpers'

import { createControlEnabledSelector } from '../../selectors/controls';
import { setControlProperty, toggleControl } from "../../actions/controls";
import { createSelector } from 'reselect';
import { Glyphicon } from 'react-bootstrap';
import Dialog from '../../components/misc/Dialog';
import LayerSelector from './mergelayer/LayerSelector'
import { groupsSelector, layersSelector } from '../../selectors/layers'
import { addLayer } from '../../actions/layers'

import { toCQLFilter } from '../../../client/utils/FilterUtils';

createControlEnabledSelector("mergelyr");

const mergeLyrState = (state) => get(state, 'controls.mergelyr.enabled')

const toggleMergeLyrTool = toggleControl.bind(null, "mergelyr", null);

const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
}

const getFeature = (layerSelected) => {
    const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
    return new Promise((resolve, reject) => {
        let params = {
            service: 'WFS',
            version: layerSelected.version,
            request: 'GetFeature',
            typeName: layerSelected.name,
            outputFormat: 'application/json',
        }
        // สำหรับ layer ที่มีการ filter จะมี layerFilter อยู่ใน obj
        if (layerSelected.layerFilter) {
            const cql_filter = toCQLFilter(layerSelected?.layerFilter);
            console.log('cql_filter', cql_filter)
            params.cql_filter = cql_filter
        }
        let getFromAPI = axios.get(`${layerSelected.url || DEFAULT_API}`, { params })
        resolve(getFromAPI);
        reject((dispatch) => { dispatch(fetchGeoJsonFailure('ERROR from getFeature Promise')) })
    })
}

let layerTitle1 = ''
let layerTitle2 = ''
const loadFeature = function (layerSelected1, layerSelected2) {
    // กรณีไม่เลือกครบ 2 layerใน dropdown
    if (!layerSelected1 || !layerSelected2) {
        layerSelected1 = {}
        layerSelected2 = {}
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Both layers didn\'t select'))
        }

        // กรณีชื่อ layer เหมือนกัน
    } else if (layerSelected1.title === layerSelected2.title) {
        layerSelected1 = {}
        layerSelected2 = {}
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Both layers are same layer'))
        }
    }
    return (dispatch) => {
        // chkFeatTypeCondition คือ Check ว่า 2 layer type นี้สามารถ merge ได้ภายใน array นี้
        const chkFeatTypeCondition = (type1, type2) => {
            let featTypeCondition = [
                ['point', 'point'],
                ['linestring', 'linestring'],
                ['polygon', 'polygon'],
                ['multilinestring', 'multilinestring'],
                ['multipolygon', 'multipolygon'],

                ['multilinestring', 'linestring'],
                ['linestring', 'multilinestring'],

                ['multipolygon', 'polygon'],
                ['polygon', 'multipolygon'],
            ]
            for (let i = 0; i < featTypeCondition.length; i++) {
                if (featTypeCondition[i][0] === type1.toLowerCase() && featTypeCondition[i][1] === type2.toLowerCase()) {
                    return true
                }
            }
            return false
        }
        const handleMerge = (canMerge, features1, features2, title) => {
            if (canMerge) {
                console.log('features1', features1)
                console.log('features2', features2)
                let mergedFeatures = featureCollection(features1.concat(features2))
                if (title === 'Annotations') {
                    mergedFeatures.features.forEach((feature) => feature.id = 'merged_' + feature.properties.id || uuidv1())
                } else {
                    mergedFeatures.features.forEach((feature) => feature.id = 'merged_' + feature.id || uuidv1())
                }
                dispatch(mergeAsLayer(mergedFeatures))
                dispatch(setLayer1(-1)); dispatch(setLayer2(-1))
                dispatch(loading(false))

            } else {
                dispatch(fetchGeoJsonFailure(`\'${features1[0].geometry.type}\' - \'${features2[0].geometry.type}\' type can't be merged`))
                dispatch(loading(false))
            }
        }

        dispatch(loading(true))
        dispatch(fetchGeoJsonFailure(''))
        // ทั้ง 2 layer มี feature อยู่ใน Client side แล้ว
        layerTitle1 = layerSelected1.title || layerSelected1.name
        layerTitle2 = layerSelected2.title || layerSelected2.name
        if (layerSelected1.features && layerSelected2.features) {
            handleMerge(chkFeatTypeCondition(layerSelected1.features[0].geometry.type, layerSelected2.features[0].geometry.type),
                layerSelected1.features,
                layerSelected2.features)

            // layer ที่ 2 มี feature อยู่ใน Client side แล้ว
        } else if (!layerSelected1.features && layerSelected2.features) {
            let getFeature1 = getFeature(layerSelected1)
            getFeature1.then(featuresColl1 => {
                handleMerge(chkFeatTypeCondition(featuresColl1.data.features[0].geometry.type, layerSelected2.features[0].geometry.type),
                    featuresColl1.data.features,
                    layerSelected2.features)
            }).catch((e) => {
                // ERROR in IF layer1 don't have feature
                dispatch(fetchGeoJsonFailure('ERROR in getFeature1'))
                dispatch(loading(false))
            })

            // layer ที่ 1 มี feature อยู่ใน Client side แล้ว
        } else if (layerSelected1.features && !layerSelected2.features) {
            let featuresArray = []
            console.log('layerTitle1', layerTitle1)
            if (layerTitle1 === 'Annotations') { // อาจไม่ได้มีแค่ Annotations
                for (let i = 0; i < layerSelected1.features.length; i++) {
                    for (let j = 0; j < layerSelected1.features[i].features.length; j++) {
                        featuresArray.push(layerSelected1.features[i].features[j])
                        console.log('layerSelected.features[i]', layerSelected1.features[i].features[j])
                    }
                }
                console.log('features', featuresArray)
            }
            console.log('featuresArray[0].geometry.type', featuresArray[0].geometry.type)
            let getFeature2 = getFeature(layerSelected2)
            getFeature2.then(featuresColl2 => {
                console.log('featuresArray[0].geometry.type', featuresArray[0].geometry.type)
                handleMerge(chkFeatTypeCondition(featuresArray[0].geometry.type, featuresColl2.data.features[0].geometry.type),
                    featuresArray,
                    featuresColl2.data.features,
                    layerTitle1
                )
            }).catch((e) => {
                // ERROR in IF layer2 don't have feature
                dispatch(fetchGeoJsonFailure('ERROR in getFeature2'))
                dispatch(loading(false))
            })

            // ทั้ง 2 layer ยังไม่มี feature ใน Client side
        } else {
            let getFeature1 = getFeature(layerSelected1)
            let getFeature2 = getFeature(layerSelected2)
            Promise.all([getFeature1, getFeature2]).then(value => {
                handleMerge(chkFeatTypeCondition(value[0].data.features[0].geometry.type, value[1].data.features[0].geometry.type),
                    value[0].data.features,
                    value[1].data.features)
            }).catch((e) => {
                // ERROR in IF both don't have feature
                dispatch(fetchGeoJsonFailure('ERROR in Promise.all'))
                dispatch(loading(false))
            })
        }
    };
};

const selector = (state) => {
    return {
        layerIndex1: state.mergelyr.layerIndex1,
        layerIndex2: state.mergelyr.layerIndex2,
        featuresSelected1: state.mergelyr.featuresSelected1,
        featuresSelected2: state.mergelyr.featuresSelected2,
        loading: state.mergelyr.loading,
        error: state.mergelyr.error
    };
};

const MERGELYR_SET_LAYER_1 = "MERGELYR_SET_LAYER_1"
const MERGELYR_SET_LAYER_2 = "MERGELYR_SET_LAYER_2"
const MERGELYR_DO_MERGE = "MERGELYR_DO_MERGE"
const MERGELYR_SET_LOADING = "MERGELYR_SET_LOADING"
const MERGELYR_ADD_AS_LAYER = "MERGELYR_ADD_AS_LAYER"
const MERGELYR_FETCH_FAILURE = "MERGELYR:FETCH_FAILURE"

const setLayer1 = function (idx) {
    return {
        type: MERGELYR_SET_LAYER_1,
        index1: idx
    }
}

const setLayer2 = function (idx) {
    return {
        type: MERGELYR_SET_LAYER_2,
        index2: idx
    }
}

const doMerge = function (layerSelected1, layerSelected2) {
    return {
        type: MERGELYR_DO_MERGE,
        layerSelected1,
        layerSelected2
    }
}

const loading = function (isLoading) {
    return {
        type: MERGELYR_SET_LOADING,
        isLoading
    }
}

const mergeAsLayer = function (featureCollection) {
    return {
        type: MERGELYR_ADD_AS_LAYER,
        featureCollection
    };
}

const fetchGeoJsonFailure = function (error) {
    return {
        type: MERGELYR_FETCH_FAILURE,
        error
    }
}

function mergelyrReducer(state = defaultState, action) {
    switch (action.type) {
        case MERGELYR_SET_LAYER_1: {
            return assign({}, state, {
                layerIndex1: action.index1
            })
        }
        case MERGELYR_SET_LAYER_2: {
            return assign({}, state, {
                layerIndex2: action.index2
            })
        }
        case MERGELYR_SET_LOADING: {
            return assign({}, state, {
                loading: action.isLoading
            })
        }
        case MERGELYR_FETCH_FAILURE: {
            return assign({}, state, {
                error: action.error
            })
        }
        default:
            return state
    }
}

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
            console.log('==> mergeAsLayerEpic')
            console.log('featuresWantToAddLayer:', featureCollection)
            return Rx.Observable.of(
                addLayer({
                    type: 'vector',
                    id: uuidv1(),
                    name: 'MergeLayer',
                    hideLoading: true,
                    features: [...featureCollection.features],
                    visibility: true,
                    title: 'Merged_' + layerTitle1 + '&' + layerTitle2
                })
            );
        });

const defaultState = {
    layerIndex1: -1,
    layerIndex2: -1,
    loading: false,
    error: ''
}

class MergeLayerComponent extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        layersNode: PropTypes.array,
        layersGroups: PropTypes.array,
        layerIndex1: PropTypes.number,
        layerIndex2: PropTypes.number,
        loading: PropTypes.bool,
        error: PropTypes.string,

        onClose: PropTypes.func,
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

        onClose: () => { },
        onDoMerge: () => { },
        onChangeLayer1: () => { },
        onChangeLayer2: () => { },
        onReset: () => { }
    }

    onClose = () => {
        this.props.onClose(false)
    }

    onChangeLayer1 = (idx) => {
        this.props.onChangeLayer1(idx)
    };

    onChangeLayer2 = (idx) => {
        this.props.onChangeLayer2(idx)
    };

    onDoMerge = () => {
        this.props.onDoMerge(this.props.layersNode[this.props.layerIndex1], this.props.layersNode[this.props.layerIndex2])
    }

    onReset = () => {
        this.props.onChangeLayer1(-1)
        this.props.onChangeLayer2(-1)
    }

    onExportData = () => {
        let mergeFt = featureCollection(this.props.featuresSelected1.features.concat(this.props.featuresSelected2.features))
        console.log('mergeFt', mergeFt)
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(mergeFt)
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
                                    key="buffer-save"
                                    className="btn btn-longdo-outline-info"
                                    style={{ minWidth: "100px" }}
                                    disabled
                                >
                                    loading...
                                </button>
                                :
                                <button
                                    key="buffer-save"
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
                            className="btn btn-longdo-outline"
                            style={{
                                minWidth: "90px",
                                marginRight: "5px",
                            }}
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
                return mergeLyrState(state);
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
        mergelyr: mergelyrReducer,
    },
    epics: {
        doMergeEpic,
        mergeAsLayerEpic,
    },
};
