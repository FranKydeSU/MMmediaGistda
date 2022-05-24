import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createControlEnabledSelector } from '../../selectors/controls';
import { createSelector } from 'reselect';
import assign from 'object-assign';
import { get } from 'lodash';
import { setControlProperty, toggleControl } from "../../actions/controls";
import turfBuffer from '@turf/buffer'
import Rx from 'rxjs';
import axios from '../../libs/ajax';
import { addLayer } from '../../actions/layers'

// import DockablePanel from '../../components/misc/DockablePanel';
import Dialog from '../../components/misc/Dialog';
import { DropdownList } from 'react-widgets';
import Toolbar from '../../components/misc/toolbar/Toolbar';
import { ButtonToolbar, Col, FormGroup, Glyphicon, Grid, Row, Tooltip } from 'react-bootstrap';
import Message from '../../components/I18N/Message';
import BorderLayout from '../../components/layout/BorderLayout'
import { groupsSelector } from '../../selectors/layers'
import LayerSelector from './nearby/LayerSelector'

createControlEnabledSelector("buffer");

const bufferState = (state) => get(state, 'controls.buffer.enabled')

const toggleBufferTool = toggleControl.bind(null, "buffer", null);

const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
}

const BUFFER_SET_LAYER = "BUFFER_SET_LAYER"
const BUFFER_SET_RADIUS = "BUFFER:SET_RADIUS"
const BUFFER_SET_UNIT = "BUFFER_SET_UNIT"
const BUFFER_DO_BUFFER = "BUFFER_DO_BUFFER"
const BUFFER_ADD_AS_LAYER = "BUFFER_ADD_AS_LAYER"
const BUFFER_FEATURE_LOADED = "BUFFER_FEATURE_LOADED"
const BUFFER_SET_LOADING = "BUFFER_SET_LOADING"
const BUFFER_FETCH_FAILURE = "BUFFER:FETCH_FAILURE"

const setLayer = function (idx) {
    return {
        type: BUFFER_SET_LAYER,
        index: idx
    }
}

const setRadius = function (radius) {
    return {
        type: BUFFER_SET_RADIUS,
        radius
    }
}

const setUnit = function (unit) {
    return {
        type: BUFFER_SET_UNIT,
        unitValue: unit
    }
}

const doBuffer = function (layerSelected, radius, unit) {
    return {
        type: BUFFER_DO_BUFFER,
        layerSelected,
        radius,
        unit
    }
}

const addAsLayer = function (bufferedFtCollection) {
    console.log('action bufferedFeatures => ', bufferedFtCollection)
    return {
        type: BUFFER_ADD_AS_LAYER,
        bufferedFtCollection
    };
}

const featureLoaded = function (featuresSelected, bufferedFeatures) {
    return {
        type: BUFFER_FEATURE_LOADED,
        featuresSelected,
        bufferedFeatures
    };
};

const loading = function (isLoading) {
    return {
        type: BUFFER_SET_LOADING,
        isLoading
    }
}

const fetchGeoJsonFailure = function (error) {
    console.log('fetchGeoJsonFailure', error)
    return {
        type: BUFFER_FETCH_FAILURE,
        error
    }
}

// const clearLoadFeature = function () {
//     return (dispatch) => {
//         dispatch(featureLoaded([]));
//     }
// }

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
            })
        }
        case BUFFER_SET_UNIT: {
            return assign({}, state, {
                unitValue: action.unitValue
            })
        }
        case BUFFER_SET_RADIUS: {
            return assign({}, state, {
                radius: action.radius
            })
        }
        case BUFFER_FEATURE_LOADED: {
            return assign({}, state, {
                featuresSelected: action.featuresSelected,
                bufferedFeatures: action.bufferedFeatures
            })
        }
        case BUFFER_SET_LOADING: {
            return assign({}, state, {
                loading: action.isLoading
            })
        }
        case BUFFER_FETCH_FAILURE: {
            return assign({}, state, {
                error: action.error
            })
        }
        default:
            return state
    }
}

const loadFeature = function (layerSelected, radius, uom) {
    if (!layerSelected) {
        return (dispatch) => {
            dispatch(fetchGeoJsonFailure('Please select layers.'))
        }
    }
    const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
    return (dispatch) => {
        dispatch(loading(true))
        dispatch(fetchGeoJsonFailure(''))
        let getFeature = new Promise((resolve, reject) => {
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
            resolve(getFromAPI)
        })
        getFeature.then((value) => {
            let featureGeoJson = value.data
            console.log('featureGeoJson: ', featureGeoJson)
            let bufferedLayer = turfBuffer(featureGeoJson, radius, { units: uom });
            console.log('bufferedLayer: ', bufferedLayer)
            dispatch(addAsLayer(bufferedLayer))
            dispatch(loading(false))
        })

        // axios.get(`${layerSelected.url || DEFAULT_API}`, {
        //     params: {
        //         service: 'WFS',
        //         version: layerSelected.version,
        //         request: 'GetFeature',
        //         typeName: layerSelected.name,
        //         outputFormat: 'application/json'
        //     }
        // }).then(({ data }) => {
        //     console.log('- Can get featureLayer -')
        //     let featureLayer = data
        //     console.log('featureLayer: ', featureLayer)
        //     let bufferedLayer = turfBuffer(featureLayer, radius, { units: uom });
        //     console.log('bufferedLayer: ', bufferedLayer)
        //     dispatch(featureLoaded(featureLayer, bufferedLayer))
        //         try {
        //             const layerType = layerInfo.properties.find((layerType) => { return layerType.localType === 'Point' })
        //             if (layerType.name !== null || layerType.name !== 'undefined') {
        //                 const positionPoint = center.y + ' ' + center.x
        //                 axios.get(`${layerSelected.url || DEFAULT_API}`, {
        //                     params: {
        //                         service: 'WFS',
        //                         version: layerSelected.version,
        //                         request: 'GetFeature',
        //                         typeNames: layerSelected.name,
        //                         outputFormat: 'application/json',
        //                         SRSName: 'EPSG:4326',
        //                         cql_filter: `DWithin(${layerType.name},POINT(${positionPoint}),${radius},meters)`
        //                     }
        //                 }).then((response) => {
        //                     console.log(response.data)
        //                     var featuresGeoJson = response.data.features
        //                     featuresGeoJson.map((geoJson) => {
        //                         if (geoJson.geometry.type === 'Point') {
        //                             geoJson['style'] = {
        //                                 iconGlyph: "map-marker",
        //                                 iconShape: "circle",
        //                                 iconColor: "blue",
        //                                 highlight: false,
        //                                 id: uuidv1()
        //                             }
        //                         }
        //                     })
        //                     featuresGeoJson.push(radiusFeature)
        //                     dispatch(featureLoaded(featuresGeoJson));
        //                 })
        //             }
        //         } catch (error) {
        //             console.log(error)
        //             dispatch(featureLoaded([]));
        //         }
        //         }).catch((e) => {
        //             console.log(e);
        //             // dispatch(featureLoaded([]));
        //         });
    };
};

const doBufferEpic = (action$, { getState = () => { } }) =>
    action$.ofType(BUFFER_DO_BUFFER)
        .filter(() => {
            return (getState().controls.buffer || {}).enabled || false;
        })
        .switchMap(({ layerSelected }) => {
            // const center = getState().map.present.center;
            // const radius = getState().nearby.radius
            // const geometry = circle(
            //     [center.x, center.y],
            //     radius,
            //     {
            //         steps: 100,
            //         units: 'kilometers'
            //     }
            // ).geometry;
            // const feature = featureRadius(radius, geometry)
            return Rx.Observable.from([
                loadFeature(layerSelected, getState().buffer.radius, getState().buffer.unitValue)
            ]);
        });

// ส่วน Add_As_Layer ที่ยังไม่สมบูรณ์
const addAsLayerEpic = (action$) =>
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
                    features: bufferedFtCollection.features,
                    visibility: true
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

// Component part
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
        onAddAsLayer: PropTypes.func,
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
        onAddAsLayer: () => { }, // อาจแก้ Epic เพราะของ measurement แปลงเป็น GeoJSON ก่อน add ต้องแก่เป็นของ buffer
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
        this.props.onDoBuffer(this.props.layersNode[this.props.layerIndex], this.props.radius, this.props.unitValue)
    }

    onChangeUnit = (unit) => {
        this.props.onChangeUnit(unit)
    }

    onChangeRadius = (radius) => {
        this.props.onChangeRadius(Number(radius))
    }

    onAddAsLayer = () => {
        console.log('-=onAddAsLayer=-');
        console.log('bufferedFeatures:', this.props.bufferedFeatures)
        this.props.onAddAsLayer(this.props.bufferedFeatures)
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
                                // disabled={disabled}
                                // value={this?.props?.uom?.length?.label}
                                // onChange={(value) => {
                                //     this.props.onChangeUom("length", value, this?.props?.uom);
                                // }}
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
                    {/* <BorderLayout
                        id={this.props.id}
                        style={{ overflow: 'visible' }}
                        header={
                            <div>
                                <ButtonToolbar>
                                    <Toolbar
                                        btnDefaultProps={{
                                            className: 'square-button-md',
                                            bsStyle: 'primary'
                                        }}
                                        buttons={
                                            [
                                                {
                                                    glyph: 'remove',
                                                    visible: !!this?.props?.withReset,
                                                    tooltip: <Message msgId="measureComponent.resetTooltip" />,
                                                    onClick: () => this?.onResetClick()
                                                }
                                            ]
                                        } />
                                </ButtonToolbar>
                            </div>
                        }></BorderLayout> */}
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
                                    // onClick={this?.onSearch}
                                    className="btn btn-longdo-outline-info"
                                    style={{ minWidth: "100px" }}
                                    // id="find-route"
                                    onClick={this.onDoBuffer}
                                >
                                    Save
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

// const mapStateToProps = (state) => ({})

// const mapDispatchToProps = {}

// export default connect(mapStateToProps, mapDispatchToProps)(Buffer)
const buffer = connect(
    createSelector(
        [
            selector,
            (state) => {
                return bufferState(state);
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
        onAddAsLayer: addAsLayer
        // onDisplaySetting: displaySetting,
        // onAddPoint: addPoint,
        // onSwapPoint: swapPoint,
        // onRemovePoint: removePoint,
        // onSearch: searchRouting,
        // onClearSearch: clearSearchRouting,
        // onChangePointInput: changePointInput,
        // onClickGuide: clickGuide,
        // onClickSearchResult: clickSearchResult,
        // onChangeRouteMode: changeRouteMode,
        // onChangeRouteType: changeRouteType
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
        addAsLayerEpic
    },
};