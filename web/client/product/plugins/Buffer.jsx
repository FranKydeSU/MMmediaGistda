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

const setLayer = function (idx) {
    return {
        type: 'BUFFER:SET_LAYER',
        index: idx
    }
}

const setRadius = function (radius) {
    return {
        type: 'BUFFER:SET_RADIUS',
        radius
    }
}

const setUnit = function (unit) {
    return {
        type: 'BUFFER:SET_UNIT',
        unitValue: unit
    }
}

const doBuffer = function (layerSelected, radius, unit) {
    return {
        type: 'BUFFER:DO_BUFFER',
        layerSelected,
        radius,
        unit
    }
}

const addAsLayer = function (bufferedFtCollection) {
    console.log('action bufferedFeatures => ', bufferedFtCollection)
    return {
        type: 'BUFFER:ADD_AS_LAYER',
        bufferedFtCollection
    };
}

const featureLoaded = function (featuresSelected, bufferedFeatures) {
    return {
        type: 'BUFFER:FEATURE_LOADED',
        featuresSelected,
        bufferedFeatures
    };
};

// const clearLoadFeature = function () {
//     return (dispatch) => {
//         dispatch(featureLoaded([]));
//     }
// }

const toggleBufferTool = toggleControl.bind(null, "buffer", null);

const selector = (state) => {
    return {
        layerIndex: state.buffer.layerIndex,
        unitValue: state.buffer.unitValue,
        radius: state.buffer.radius,
        featuresSelected: state.buffer.featuresSelected,
        bufferedFeatures: state.buffer.bufferedFeatures
    };
};

function bufferReducer(state = defaultState, action) {
    switch (action.type) {
        case 'BUFFER:SET_LAYER': {
            return assign({}, state, {
                layerIndex: action.index
            })
        }
        case 'BUFFER:SET_UNIT': {
            return assign({}, state, {
                unitValue: action.unitValue
            })
        }
        case 'BUFFER:SET_RADIUS': {
            return assign({}, state, {
                radius: action.radius
            })
        }
        case 'BUFFER:FEATURE_LOADED': {
            return assign({}, state, {
                featuresSelected: action.featuresSelected,
                bufferedFeatures: action.bufferedFeatures
            })
        }
        default:
            return state
    }
}

const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
}

const loadFeature = function (layerSelected, radius, uom) {
    if (!layerSelected) {
        layerSelected = {}
    }
    const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
    return (dispatch) => {
        axios.get(`${layerSelected.url || DEFAULT_API}`, {
            params: {
                service: 'WFS',
                version: layerSelected.version,
                request: 'GetFeature',
                typeName: layerSelected.name,
                outputFormat: 'application/json'
            }
        }).then(({ data }) => {
            console.log('- Can get featureLayer -')
            let featureLayer = data
            console.log('featureLayer: ', featureLayer)
            let bufferedLayer = turfBuffer(featureLayer, radius, { units: uom });
            console.log('bufferedLayer: ', bufferedLayer)
            dispatch(featureLoaded(featureLayer, bufferedLayer))
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
        }).catch((e) => {
            console.log(e);
            // dispatch(featureLoaded([]));
        });
    };
};

const doBufferEpic = (action$, { getState = () => { } }) =>
    action$.ofType('BUFFER:DO_BUFFER')
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
    action$.ofType('BUFFER:ADD_AS_LAYER')
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
    unitValue: "kilometers"
}

// Component part
class BufferDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        radius: PropTypes.number,
        onClose: PropTypes.func,
        bufferLengthValue: PropTypes.array,
        layersNode: PropTypes.array,
        layersGroups: PropTypes.array,
        layerIndex: PropTypes.number,
        onChangeLayer: PropTypes.func,
        onChangeUnit: PropTypes.func,
        unitValue: PropTypes.string,
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
        onAddAsLayer: () => { } // อาจแก้ Epic เพราะของ measurement แปลงเป็น GeoJSON ก่อน add ต้องแก่เป็นของ buffer
    };

    onClose = () => {
        this.props.onClose(false)
    }

    onLayerChange = (idx) => {
        this.props.onChangeLayer(idx)
    };

    onDoBuffer = (e) => {
        e.preventDefault();
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
                    <br />
                    {/* {this.props.errNoLayer ? <p>please select layer</p> : null} */}
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

                    <button
                        key="clear-routing"
                        onClick={this.onClearSearch}
                        className="btn btn-longdo-outline"
                        style={{
                            minWidth: "90px",
                            marginRight: "5px",
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn btn-longdo-outline-info"
                        onClick={this.onAddAsLayer}
                        style={{ minWidth: "100px" }}
                    >
                        ADD
                    </button>

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