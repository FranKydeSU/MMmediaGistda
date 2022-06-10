import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createControlEnabledSelector } from '../../selectors/controls';
import { createSelector } from 'reselect';
import assign from 'object-assign';
import { get } from 'lodash';
import { setControlProperty, toggleControl } from "../../actions/controls";
import turfBuffer from '@turf/buffer';
import Rx from 'rxjs';
import axios from '../../libs/ajax';
import { addLayer } from '../../actions/layers';
import { featureCollection } from '@turf/helpers';
import uuidv1 from 'uuid/v1';

import Dialog from '../../components/misc/Dialog';
import { DropdownList } from 'react-widgets';
import { Col, Glyphicon, Row } from 'react-bootstrap';
import { groupsSelector } from '../../selectors/layers';
import LayerSelector from './buffer/LayerSelector';

import { toCQLFilter } from '../../../client/utils/FilterUtils';

createControlEnabledSelector("buffer");

const bufferSelector = (state) => get(state, 'controls.buffer.enabled');

// const toggleBufferTool = toggleControl.bind(null, "buffer", null);
const toggleBufferTool = () => {
    return {
        type: TOGGLE_CONTROL,
        control: 'buffer',
        property: null,
        layerSelected: {},
        layerIndex: -1,
        loading: false
    };
};

const layerNodesExtracter = (groups) => {
    const layerNode = [];
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes);
    })
    return layerNode;
};

const BUFFER_SET_LAYER = "BUFFER:SET_LAYER";
const BUFFER_SET_RADIUS = "BUFFER:SET_RADIUS";
const BUFFER_SET_UNIT = "BUFFER:SET_UNIT";
const BUFFER_DO_BUFFER = "BUFFER:DO_BUFFER";
const BUFFER_ADD_AS_LAYER = "BUFFER:ADD_AS_LAYER";
const BUFFER_FEATURE_LOADED = "BUFFER:FEATURE_LOADED";
const BUFFER_SET_LOADING = "BUFFER:SET_LOADING";
const BUFFER_FETCH_FAILURE = "BUFFER:FETCH_FAILURE";
// ค่าพิื้นฐานที่เรียกใช้คือ TOGGLE_CONTROL -> /reducers/controls.js
export const TOGGLE_CONTROL = 'TOGGLE_CONTROL';

const setLayer = function (idx) {
    return {
        type: BUFFER_SET_LAYER,
        index: idx
    };
};

const setRadius = function (radius) {
    return {
        type: BUFFER_SET_RADIUS,
        radius
    };
};

const setUnit = function (unit) {
    return {
        type: BUFFER_SET_UNIT,
        unitValue: unit
    };
};

const doBuffer = function (layerSelected) {
    return {
        type: BUFFER_DO_BUFFER,
        layerSelected,
    };
};

const addAsLayer = function (bufferedFtCollection) {
    console.log('addAsLayer Action', bufferedFtCollection)
    return {
        type: BUFFER_ADD_AS_LAYER,
        bufferedFtCollection
    };
};

const loading = function (isLoading) {
    return {
        type: BUFFER_SET_LOADING,
        isLoading
    };
};

const fetchGeoJsonFailure = function (error) {
    console.log('fetchGeoJsonFailure', error)
    return {
        type: BUFFER_FETCH_FAILURE,
        error
    };
};

const selector = (state) => {
    return {
        layerIndex: state.buffer.layerIndex,
        unitValue: state.buffer.unitValue,
        radius: state.buffer.radius,
        featuresSelected: state.buffer.featuresSelected,
        bufferedFeatures: state.buffer.bufferedFeatures,
        loading: state.buffer.loading,
        error: state.buffer.error
    };
};

function bufferReducer(state = defaultState, action) {
    switch (action.type) {
        case BUFFER_SET_LAYER: {
            return assign({}, state, {
                layerIndex: action.index
            });
        };
        case BUFFER_SET_UNIT: {
            return assign({}, state, {
                unitValue: action.unitValue
            });
        };
        case BUFFER_SET_RADIUS: {
            return assign({}, state, {
                radius: action.radius
            });
        };
        case BUFFER_FEATURE_LOADED: {
            return assign({}, state, {
                featuresSelected: action.featuresSelected,
                bufferedFeatures: action.bufferedFeatures
            });
        };
        case BUFFER_SET_LOADING: {
            return assign({}, state, {
                loading: action.isLoading
            });
        };
        case BUFFER_FETCH_FAILURE: {
            return assign({}, state, {
                error: action.error
            });
        };
        case TOGGLE_CONTROL: {
            return assign({}, state, {
                layerSelected: action.layerSelected,
                layerIndex: action.layerIndex,
                loading: action.loading
            });
        };
        default:
            return state;
    };
};

// เพื่อกระจาย features ออกจาก features array ถ้าเป็น Annotation <- อาจมีอย่างอื่นด้วย เช่น Measurement
const spreadFeatures = (layerSelected) => { // for Annotation
    let featuresArray = [];
    for (let i = 0; i < layerSelected.features.length; i++) {
        for (let j = 0; j < layerSelected.features[i].features.length; j++) {
            featuresArray.push(layerSelected.features[i].features[j]);
        }
    }
    console.log('spreadFeatures: ', featuresArray);
    return featuresArray;
};

let layerTitle = ''
const loadFeature = function (layerSelected) {
    if (!layerSelected) {
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Please select layers.'));
        }
    }
    return (dispatch, getState) => {
        console.log('layerSelected', layerSelected);
        dispatch(loading(true));
        dispatch(fetchGeoJsonFailure(''));
        layerTitle = layerSelected.title || layerSelected.name;

        // ถ้า layer นี้มี features ใน Client Side
        if (layerSelected.features) {
            console.log('Enter IF layerSelected.features', layerSelected.features);
            console.log('layerTitle', layerTitle);

            new Promise((resolve, reject) => {
                let featuresGeoJson;
                let typeName;
                let checkAllFeaturesType;
                let featuresIdTemp = [];
                // if นี้เพื่อ checkAllFeaturesType
                if (layerTitle === 'Annotations') { // อาจไม่ได้มีแค่ Annotations
                    featuresGeoJson = spreadFeatures(layerSelected)
                    typeName = featuresGeoJson[0].geometry.type
                    checkAllFeaturesType = featuresGeoJson.every((feature) => feature.geometry.type === typeName)
                } else {
                    featuresGeoJson = layerSelected.features;
                    typeName = featuresGeoJson[0].geometry.type;
                    checkAllFeaturesType = featuresGeoJson.every((feature) => feature.geometry.type === typeName);
                }

                if (checkAllFeaturesType) {
                    let featuresCollectionGeoJson = featureCollection(featuresGeoJson);
                    featuresCollectionGeoJson.features.forEach((feature) => {
                        if (feature.id) {
                            featuresIdTemp.push(feature.id);
                        } else if (feature.properties.id) { // For Annotation or etc.
                            featuresIdTemp.push(feature.properties.id);
                        }
                    })
                    let result = turfBuffer(featuresCollectionGeoJson, getState().buffer.radius, { units: getState().buffer.unitValue });
                    result.features.forEach((feature, i) => {
                        feature.id = 'buffered_' + featuresIdTemp[i];
                        if (feature.properties.id) {
                            feature.properties.id = 'buffered_' + featuresIdTemp[i];
                        }
                    })
                    resolve(result);
                } else {
                    dispatch(fetchGeoJsonFailure('All feature must be same type'));
                    dispatch(loading(false));
                }
            }).then(bufferedFeatures => {
                console.log('bufferedLayer after Promise in if: ', bufferedFeatures);
                dispatch(addAsLayer(bufferedFeatures));
                dispatch(setLayer(-1));
                dispatch(loading(false));
            }).catch((e) => {
                console.log(e);
                dispatch(fetchGeoJsonFailure('ERROR in IF layer have feature'));
                dispatch(loading(false));
            })

        } else {
            const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
            new Promise((resolve, reject) => {
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
            }).then((featuresCollectionGeoJSON) => {
                let featuresCollectionData = featuresCollectionGeoJSON.data
                console.log('featuresCollectionData', featuresCollectionData)
                let typeName = featuresCollectionData.features[0].geometry.type
                let checkAllFeaturesType = featuresCollectionData.features.every((feature) => feature.geometry.type === typeName)
                if (checkAllFeaturesType) {
                    new Promise((resolve, reject) => {
                        console.log('featuresCollectionGeoJson', featuresCollectionData)
                        let featuresIdTemp = []
                        featuresCollectionData.features.forEach((feature) => featuresIdTemp.push(feature.id))
                        console.log('featuresIdTemp', featuresIdTemp)
                        let result = turfBuffer(featuresCollectionData, getState().buffer.radius, { units: getState().buffer.unitValue });
                        result.features.forEach((feature, i) => {
                            feature.id = 'buffered_' + featuresIdTemp[i];
                            if (feature.properties.id) {
                                feature.properties.id = 'buffered_' + featuresIdTemp[i];
                            }
                        })
                        resolve(result)
                    }).then(bufferedFeatures => {
                        console.log('bufferedLayer after Promise: ', bufferedFeatures)
                        dispatch(addAsLayer(bufferedFeatures))
                        dispatch(setLayer(-1))
                        dispatch(loading(false))
                    }).catch((err) => {
                        console.log(err);
                        dispatch(fetchGeoJsonFailure('ERROR in Turf'))
                        dispatch(loading(false))
                    })
                } else {
                    dispatch(fetchGeoJsonFailure('All feature must be same type'))
                    dispatch(loading(false))
                }
            }).catch(() => {
                dispatch(loading(false))
                dispatch(fetchGeoJsonFailure('ERROR in getFeature'))
            })
        }
    }
}

// epic ที่ไว้ดึง featuresCollection จาก services โดย loadFeature function
const doBufferEpic = (action$, { getState = () => { } }) =>
    action$.ofType(BUFFER_DO_BUFFER)
        .filter(() => {
            return (getState().controls.buffer || {}).enabled || false;
        })
        .switchMap(({ layerSelected }) => {
            return Rx.Observable.from([
                loadFeature(layerSelected)
            ]);
        });

// ส่วน Add_As_Layer ที่ buffer แล้วมาเพิ่มใน layers panel ด้านซ้ายกับวาดลงแผนที่
const addAsBufferedLayerEpic = (action$) =>
    action$.ofType(BUFFER_ADD_AS_LAYER)
        .switchMap(({ bufferedFtCollection }) => {
            console.log('==> addAsLayerEpic')
            console.log('bufferedLayer in epic:', bufferedFtCollection)
            return Rx.Observable.of(
                addLayer({
                    type: 'vector',
                    id: uuidv1(),
                    name: 'BufferedLayer',
                    hideLoading: true,
                    features: [...bufferedFtCollection.features],
                    visibility: true,
                    // style: {
                    //     "weight": 1,
                    //     "radius": 7,
                    //     "opacity": 1,
                    //     "fillOpacity": 1,
                    //     "color": "rgba(255, 0, 0, 1)",
                    //     "fillColor": "rgb(4, 4, 250)"
                    // },
                    title: 'Buffered_' + layerTitle
                })
            );
        });

const defaultState = {
    radius: 1,
    layerIndex: -1,
    unitValue: "kilometers",
    loading: false,
    error: ''
}

class BufferDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        radius: PropTypes.number,
        bufferLengthValue: PropTypes.array,
        layersNode: PropTypes.array,
        layersGroups: PropTypes.array,
        layerIndex: PropTypes.number,
        unitValue: PropTypes.string,
        loading: PropTypes.bool,
        error: PropTypes.string,

        onClose: PropTypes.func,
        onChangeLayer: PropTypes.func,
        onChangeUnit: PropTypes.func,
        onDoBuffer: PropTypes.func,
    }

    static defaultProps = {
        show: false,
        bufferUnitValues: [
            { value: "kilometers", label: "km" },
            { value: "miles", label: "miles" },
            { value: "degrees", label: "degrees" },
        ],
        radius: 1,
        layersNode: [],
        layersGroups: [],
        layerIndex: -1,
        unitValue: '',

        onClose: () => { },
        onChangeLayer: () => { },
        onChangeUnit: () => { },
        onDoBuffer: () => { },

    };

    onClose = () => {
        this.props.onClose(false)
    }

    onLayerChange = (idx) => {
        this.props.onChangeLayer(idx)
    };

    onDoBuffer = () => {
        console.log('radius:', this.props.radius)
        console.log('unit:', this.props.unitValue)
        this.props.onDoBuffer(this.props.layersNode[this.props.layerIndex])
    }

    onChangeUnit = (unit) => {
        this.props.onChangeUnit(unit)
    }

    onChangeRadius = (radius) => {
        this.props.onChangeRadius(Number(radius))
    }

    onReset = () => {
        this.props.onChangeLayer(-1)
    }

    render() {
        return this.props.show ? (
            <Dialog Dialog id="measure-dialog" style={this?.dialogStyle} start={this?.start} >
                <div key="header" role="header">
                    <Glyphicon glyph="folder-open" />&nbsp;Buffer
                    <button key="close" onClick={this.onClose} className="close"><Glyphicon glyph="1-close" /></button>
                </div>
                <div key="body" role="body">
                    <p>Layer</p>
                    <LayerSelector
                        responses={this.props.layersNode}
                        index={this.props.layerIndex}
                        setIndex={this.onLayerChange}
                    ></LayerSelector>
                    <br />
                    <p>Buffer size</p>
                    <Row>
                        <Col md={6}>
                            <input
                                required
                                type="number"
                                className="form-control"
                                id="buffer-size"
                                onChange={e => this.onChangeRadius(e.nativeEvent.target.value)}
                                value={this.props.radius}
                            />
                        </Col>
                        <Col md={6}>
                            <DropdownList
                                id='bufferUnitValues'
                                data={this.props.bufferUnitValues}
                                dataKey="value"
                                textField="label"
                                valueField="value"
                                defaultValue={this.props.bufferUnitValues[0]}
                                onChange={(unit) => {
                                    console.log(unit)
                                    return this.onChangeUnit(unit.value)
                                }}
                            />
                        </Col>
                    </Row>
                    <div
                        style={{
                            display: "flex"
                        }}>
                        <br />
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
                                    className="btn btn-longdo-outline-info"
                                    style={{ minWidth: "100px" }}
                                    onClick={this.onDoBuffer}
                                >
                                    Buffer
                                </button>
                        }

                        <button
                            key="clear-routing"
                            onClick={this.onReset}
                            className="btn btn-longdo-outline"
                            style={{
                                minWidth: "90px",
                                marginRight: "5px",
                            }}
                        >
                            Clear
                        </button>

                        <p style={{ color: "red" }}>{this.props.error}</p>
                    </div>
                </div>
            </Dialog >
        ) : null
    }
}

const buffer = connect(
    createSelector(
        [
            selector,
            (state) => {
                return bufferSelector(state);
            },
            groupsSelector,
        ],
        (bufferState, show, layersGroups) => {
            return {
                ...bufferState,
                show,
                layersGroups,
                layersNode: layerNodesExtracter(layersGroups)
            };
        }
    ),
    {
        onClose: toggleBufferTool,
        onChangeLayer: setLayer,
        onChangeUnit: setUnit,
        onChangeRadius: setRadius,
        onDoBuffer: doBuffer,
    },
    null,
    {
        pure: false,
    }
)(BufferDialog);

export default {
    BufferPlugin: assign(buffer, {
        BurgerMenu: {
            name: "buffer",
            position: 10,
            panel: false,
            help: "help",
            tooltip: "tooltip",
            text: "Buffer",
            icon: <Glyphicon glyph="resize-full" />,
            action: () => setControlProperty("buffer", "enabled", true),
        },
    }),
    reducers: {
        buffer: bufferReducer
    },
    epics: {
        doBufferEpic,
        addAsBufferedLayerEpic
    },
};