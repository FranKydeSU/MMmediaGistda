import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import assign from 'object-assign';
import { get } from 'lodash';
import { find } from 'lodash';
import axios from '../../libs/ajax';
import Rx from 'rxjs';
import uuidv1 from 'uuid/v1';
import { featureCollection } from '@turf/helpers'

import { createControlEnabledSelector } from '../../selectors/controls';
import { setControlProperty, toggleControl } from "../../actions/controls";
import { createSelector } from 'reselect';
import { ButtonToolbar, Col, FormGroup, Glyphicon, Grid, Row, Tooltip } from 'react-bootstrap';
import { DropdownList } from 'react-widgets';
import Dialog from '../../components/misc/Dialog';
import LayerSelector from './mergelayer/LayerSelector'
import { groupsSelector, layersSelector } from '../../selectors/layers'
import { addLayer } from '../../actions/layers'
import { changeDrawingStatus } from '../../actions/draw';
import { all } from 'lodash/fp';
import { parseString } from '../../utils/CoordinatesUtils';

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
            let getFromAPI = axios.get(`${layerSelected.url || DEFAULT_API}`,
                {
                    params: {
                        service: 'WFS',
                        version: layerSelected.version,
                        request: 'GetFeature',
                        typeName: layerSelected.name,
                        outputFormat: 'application/json'
                    }
                })
            resolve(getFromAPI);
            reject((dispatch) => { dispatch(fetchGeoJsonFailure('error from promise')) })
        })
}

const loadFeature = function (layerSelected1, layerSelected2) {
    
    console.log('LayerSelected1 ', layerSelected1)
    console.log('LayerSelected2 ', layerSelected2)
    if (!layerSelected1 || !layerSelected2) {
        layerSelected1 = {}
        layerSelected2 = {}
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Please select 2 layers.'))
        }
    } else if (layerSelected1.title === layerSelected2.title) {
        layerSelected1 = {}
        layerSelected2 = {}
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Please don\'t selected same layer.'))
        }
    }
    return (dispatch) => {
        dispatch(loading(true))
        dispatch(fetchGeoJsonFailure(''))
        if (layerSelected1.features && layerSelected2.features) {

            console.log('===Enter IF both have layer===')
            let mergedFeatures = featureCollection(layerSelected1.features.concat(layerSelected2.features))
            console.log('layerSelected1.features', layerSelected1.features)
            console.log('layerSelected2.features', layerSelected2.features)
            console.log('mergedLyr if both have layer: ', mergedFeatures)
            dispatch(mergeAsLayer(mergedFeatures))

        } else if (!layerSelected1.features && layerSelected2.features) {

            console.log('===Enter IF lry1 dont have layer===')
            let getFeature1 = getFeature(layerSelected1)

            getFeature1.then(featuresColl => {
                console.log('featuresColl.data', featuresColl.data)
                let mergedFeatures = featureCollection(featuresColl.data.features.concat(layerSelected2.features))
                console.log('featuresColl.data.features', featuresColl.data.features)
                console.log('layerSelected2.features', layerSelected2.features)
                console.log('mergedLyr if lry1 dont have layer: ', mergedFeatures)
                dispatch(mergeAsLayer(mergedFeatures))
                dispatch(setLayer1(-1))
                dispatch(setLayer2(-1))
                dispatch(loading(false))
            })

        } else if (layerSelected1.features && !layerSelected2.features) {

            console.log('===Enter IF lry2 dont have layer===')
            console.log('layerSelected1: ',layerSelected1)
            let getFeature2 = getFeature(layerSelected2)

            getFeature2.then(featuresColl => {
                console.log('featuresColl.data', featuresColl.data)
                let mergedFeatures = featureCollection(layerSelected1.features.concat(featuresColl.data.features))
                console.log('layerSelected1.features', layerSelected1.features)
                console.log('featuresColl.data.features', featuresColl.data.features)
                console.log('mergedLyr if lry2 dont have layer: ', mergedFeatures)
                dispatch(mergeAsLayer(mergedFeatures))
                dispatch(setLayer1(-1))
                dispatch(setLayer2(-1))
                dispatch(loading(false))
            })
        } else {
            let getFeature1 = getFeature(layerSelected1)
            let getFeature2 = getFeature(layerSelected2)
            console.log('===Enter IF both dont have layer===')
            Promise.all([getFeature1, getFeature2]).then(value => {
                let mergedFeatures = featureCollection(value[0].data.features.concat(value[1].data.features))
                console.log('value[0].data.features', value[0].data.features)
                console.log('value[1].data.features', value[1].data.features)
                console.log('mergedFeatures:', mergedFeatures)
                dispatch(featureLoaded1(value[0].data))
                dispatch(featureLoaded2(value[1].data))
                dispatch(mergeAsLayer(mergedFeatures))
                dispatch(setLayer1(-1))
                dispatch(setLayer2(-1))
                dispatch(loading(false))
            }).catch((error) => {
                dispatch(fetchGeoJsonFailure('error'))
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
const MERGELYR_FEATURE_LOADED_1 = "MERGELYR_FEATURE_LOADED_1"
const MERGELYR_FEATURE_LOADED_2 = "MERGELYR_FEATURE_LOADED_2"
const MERGELYR_SET_LOADING = "MERGELYR_SET_LOADING"
const MERGELYR_ADD_AS_LAYER = "MERGELYR_ADD_AS_LAYER"
const MERGELYR_CHANGE_DRAWING = "MERGELYR_CHANGE_DRAWING"
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

const featureLoaded1 = function (featuresSelected1) {
    return {
        type: MERGELYR_FEATURE_LOADED_1,
        featuresSelected1
    }
}

const featureLoaded2 = function (featuresSelected2) {
    return {
        type: MERGELYR_FEATURE_LOADED_2,
        featuresSelected2
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

const changeDrawing = function (featureCollection) {
    return {
        type: MERGELYR_CHANGE_DRAWING,
        featureCollection
    };
}

const fetchGeoJsonFailure = function (error) {
    console.log('fetchGeoJsonFailure', error)
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
        case MERGELYR_FEATURE_LOADED_1: {
            return assign({}, state, {
                featuresSelected1: action.featuresSelected1,
            })
        }
        case MERGELYR_FEATURE_LOADED_2: {
            return assign({}, state, {
                featuresSelected2: action.featuresSelected2
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

// epic ที่ต้องการนำ features ที่ merge แล้วเพิ่มใน layers panel ด้านซ้ายกับวาดลงแผนที่
const mergeAsLayerEpic = (action$) =>
    action$.ofType(MERGELYR_ADD_AS_LAYER)
        .switchMap(({ featureCollection }) => {
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: true,
                translateEnabled: false,
                drawEnabled: false
            };
            console.log('==> mergeAsLayerEpic')
            console.log('featuresWantToAddLayer:', featureCollection)
            const featureCollections = [
                {
                    type: "FeatureCollection",
                    newFeature: true,
                    id: uuidv1(),
                    geometry: null,
                    properties: uuidv1(),
                    features: [...featureCollection.features],
                },
            ];
            // const fe = [
            //     {
            //         "type": "Feature",
            //         "geometry": {
            //             "type": "Point",
            //             "coordinates": [100, 13],
            //         }
            //     },
            // ]
            // console.log('fe ', fe)
            let mergeLyr_id = 0
            return Rx.Observable.of(
                // changeDrawingStatus('drawOrEdit', 'MultiPolygons', 'mergelyr', featureCollections, drawOptions),
                addLayer({
                    type: 'vector',
                    id: uuidv1(),
                    name: 'MergeLayer',
                    hideLoading: true,
                    features: [...featureCollection.features],
                    visibility: true,
                    style: {
                        "weight": 1,
                        "radius": 7,
                        "opacity": 1,
                        // "fillOpacity": 1,
                        "color": "rgba(255, 0, 0, 1)",
                        // "fillColor": "rgb(4, 4, 250)"
                    },
                    title: 'MergeLayer_' + String(mergeLyr_id++)
                })
            );
        });

const defaultState = {
    layerIndex1: -1,
    layerIndex2: -1,
    featuresSelected1: {},
    featuresSelected2: {},
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
        featuresSelected1: PropTypes.object,
        featuresSelected2: PropTypes.object,
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
        featuresSelected1: {},
        featuresSelected2: {},
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
                                    Save
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
        // onChangeDrawing: changeDrawing
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
        // changeDrawingEpic
    },
};
