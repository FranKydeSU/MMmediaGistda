import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import assign from 'object-assign';
import { get } from 'lodash';
import { find } from 'lodash';
import axios from '../../libs/ajax';
import Rx from 'rxjs'
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

createControlEnabledSelector("mergelyr");

const mergeLyrState = (state) => get(state, 'controls.mergelyr.enabled')

const toggleBufferTool = toggleControl.bind(null, "mergelyr", null);

const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
}

const loadFeature = function (layerSelected1, layerSelected2) {
    console.log('layerSelected1: ', layerSelected1)
    console.log('layerSelected2: ', layerSelected2)
    if (!layerSelected1 || !layerSelected2) {
        layerSelected1 = {}
        layerSelected2 = {}
    }
    const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
    return (dispatch, getState) => {
        dispatch(loading(true))
        axios.get(`${layerSelected1.url || DEFAULT_API}`, {
            params: {
                service: 'WFS',
                version: layerSelected1.version,
                request: 'GetFeature',
                typeName: layerSelected1.name,
                outputFormat: 'application/json'
            }
        }).then(({ data }) => {
            console.log('--Can get LayerFeatures--')
            let featureLayer1 = data
            console.log('featureLayer1: ', featureLayer1)
            dispatch(featureLoaded1(featureLayer1))
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
            dispatch(featureLoaded1([]));
            dispatch(loading(false))
        });
        axios.get(`${layerSelected2.url || DEFAULT_API}`, {
            params: {
                service: 'WFS',
                version: layerSelected2.version,
                request: 'GetFeature',
                typeName: layerSelected2.name,
                outputFormat: 'application/json'
            }
        }).then(({ data }) => {
            let featureLayer2 = data
            console.log('featureLayer2: ', featureLayer2)
            dispatch(featureLoaded2(featureLayer2))
            dispatch(loading(false))
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
            dispatch(featureLoaded2([]));
            dispatch(loading(false))
        });
    };
};

const selector = (state) => {
    return {
        layerIndex1: state.mergelyr.layerIndex1,
        layerIndex2: state.mergelyr.layerIndex2,
        featuresSelected1: state.mergelyr.featuresSelected1,
        featuresSelected2: state.mergelyr.featuresSelected2,
        loading: state.mergelyr.loading
    };
};

const setLayer1 = function (idx) {
    return {
        type: 'MERGELYR:SET_LAYER_1',
        index1: idx
    }
}

const setLayer2 = function (idx) {
    return {
        type: 'MERGELYR:SET_LAYER_2',
        index2: idx
    }
}

const doMerge = function (layerSelected1, layerSelected2) {
    return {
        type: 'MERGELYR:DO_MERGE',
        layerSelected1,
        layerSelected2
    }
}

const featureLoaded1 = function (featuresSelected1) {
    return {
        type: 'MERGELYR:FEATURE_LOADED_1',
        featuresSelected1
    }
}

const featureLoaded2 = function (featuresSelected2) {
    return {
        type: 'MERGELYR:FEATURE_LOADED_2',
        featuresSelected2
    }
}

const loading = function (isLoading) {
    // console.log('isLoading', isLoading)
    return {
        type: 'MERGELYR:SET_LOADING',
        isLoading
    }
}

const MergeAsLayer = function (featureCollection) {
    return {
        type: 'MERGELYR:ADD_AS_LAYER',
        featureCollection
    };
}

const changeDrawing = function (featureCollection) {
    return {
        type: 'MERGELYR:CHANGE_DRAWING',
        featureCollection
    };
}

function mergelyrReducer(state = defaultState, action) {
    switch (action.type) {
        case 'MERGELYR:SET_LAYER_1': {
            return assign({}, state, {
                layerIndex1: action.index1
            })
        }
        case 'MERGELYR:SET_LAYER_2': {
            return assign({}, state, {
                layerIndex2: action.index2
            })
        }
        case 'MERGELYR:FEATURE_LOADED_1': {
            return assign({}, state, {
                featuresSelected1: action.featuresSelected1,
            })
        }
        case 'MERGELYR:FEATURE_LOADED_2': {
            return assign({}, state, {
                featuresSelected2: action.featuresSelected2
            })
        }
        case 'MERGELYR:SET_LOADING': {
            return assign({}, state, {
                loading: action.isLoading
            })
        }
        default:
            return state
    }
}

const doMergeEpic = (action$, { getState = () => { } }) =>
    action$.ofType('MERGELYR:DO_MERGE')
        .filter(() => {
            return (getState().controls.mergelyr || {}).enabled || false;
        })
        .switchMap(({ layerSelected1, layerSelected2 }) => {
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
                loadFeature(layerSelected1, layerSelected2)
            ]);
        });

const mergeAsLayerEpic = (action$) =>
    action$.ofType('MERGELYR:ADD_AS_LAYER')
        .switchMap(({ featureCollection }) => {
            console.log('==> mergeAsLayerEpic')
            console.log('featuresWantToAddLayer:', featureCollection)
            // const layerFeature = convertMeasuresToGeoJSON(features, textLabels, uom, uuidv1());
            return Rx.Observable.of(
                // changeDrawingStatus('drawOrEdit', 'Point', 'nearbyResult', featureCollection, drawOptions),
                addLayer({
                    type: 'vector',
                    id: uuidv1(),
                    name: 'MergeLayer',
                    hideLoading: true,
                    features: [featureCollection.features],
                    visibility: true
                })
            );
        });
const changeDrawingEpic = (action$, { getState = () => { } }) =>
    action$.ofType('MERGELYR:CHANGE_DRAWING')
        .filter(() => {
            return (getState().controls.mergelyr || {}).enabled || false;
        })
        .switchMap(({featureCollection}) => {
            console.log('==> changeDrawingEpic')
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: true,
                translateEnabled: false,
                drawEnabled: false
            };
            // const center = getState().map.present.center;
            // const radius = getState().nearby.radius
            // const centerFixed = getState().nearby.centerFixed
            // const centerLocked = getState().nearby.centerLocked
            // const geometry = circle(
            //     [
            //         centerLocked ? centerFixed.x : center.x,
            //         centerLocked ? centerFixed.y : center.y
            //     ],
            //     radius,
            //     {
            //         steps: 100,
            //         units: 'kilometers'
            //     }
            // ).geometry;
            // const radiusFeature = featureRadius(radius, geometry)
            // const features = getState().nearby.results
            // const featureCollection = [
            //     {
            //         type: "FeatureCollection",
            //         newFeature: true,
            //         id: uuidv1(),
            //         geometry: null,
            //         properties: uuidv1(),
            //         features: [...features, radiusFeature],
            //     },
            // ];
            return Rx.Observable.from([
                changeDrawingStatus('drawOrEdit', 'Point', 'mergelyr', featureCollection, drawOptions)
            ]);
        });

const defaultState = {
    layerIndex1: -1,
    layerIndex2: -1,
    featuresSelected1: {},
    featuresSelected2: {},
    loading: false
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

        onClose: PropTypes.func,
        onDoMerge: PropTypes.func,
        onMerge: PropTypes.func,
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

        onClose: () => { },
        onDoMerge: () => { },
        onMerge: () => { },
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

    onMerge = () => { // อันนี้ลอง merge จริงๆ onDoMerge คือแค่ดึง features จาก services
        // console.log(this.props.featuresSelected1.features, this.props.featuresSelected2.features)
        let mergedFeatures = featureCollection(this.props.featuresSelected1.features.concat(this.props.featuresSelected2.features))
        // mergedFeatures.features.concat(this.props.featuresSelected2.features)
        console.log('mergedFeatures:', mergedFeatures.features)
        // this.props.onMerge(this.props.featureLayer1)
        this.onChangeDrawing(mergedFeatures)
        this.onAddLayer(mergedFeatures)
    }

    onAddLayer = (mergedFeatures) => {
        this.props.onAddLayer(mergedFeatures);
    }

    onChangeDrawing = (mergedFeatures) => {
        this.props.onChangeDrawing(mergedFeatures)
    }

    render() {
        return this.props.show ? (
            <Dialog Dialog id="measure-dialog" style={this?.dialogStyle} start={this?.start} >
                {/* {console.log(this.props.layerSelected1)} */}
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
                        key="clear-routing"
                        // onClick={this.onClearSearch}
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
                        onClick={this.onMerge}
                        style={{ minWidth: "100px" }}
                    >
                        ADD
                    </button>

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
            groupsSelector
        ],
        (mergeLyrState, show, layersGroups) => {
            return {
                ...mergeLyrState,
                show,
                layersGroups,
                layersNode: layerNodesExtracter(layersGroups)
            };
        }
    ),
    {
        onClose: toggleBufferTool,
        onChangeLayer1: setLayer1,
        onChangeLayer2: setLayer2,
        onDoMerge: doMerge,
        onAddLayer: MergeAsLayer,
        onChangeDrawing: changeDrawing
        // onChangeUnit: setUnit,
        // onChangeRadius: setRadius,
        // onDoBuffer: doBuffer,
        // onAddAsLayer: addAsLayer
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
)(MergeLayerComponent);

export default {
    BufferPlugin: assign(mergelyr, {
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
        changeDrawingEpic
    },
};
