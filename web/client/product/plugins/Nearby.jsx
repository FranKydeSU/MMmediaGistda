import uuidv1 from "uuid/v1";
import assign from 'object-assign';
import React from 'react';
import axios from '../../libs/ajax';
import Rx from 'rxjs';
import PropTypes from 'prop-types';
// import Dialog from '../../components/misc/Dialog';
import Slider from 'react-nouislider';
import circle from '@turf/circle';
import Select from 'react-select';
import Button from '../../components/misc/Button';
import Dock from 'react-dock';
import BorderLayout from '../../components/layout/BorderLayout'
import ContainerDimensions from 'react-container-dimensions';
import LayerSelector from './nearby/LayerSelector'

import { get } from 'lodash';
import { setControlProperty, toggleControl } from '../../actions/controls';
import { Glyphicon } from 'react-bootstrap';
import { createControlEnabledSelector } from '../../selectors/controls';
import { createSelector } from 'reselect';
import { connect } from 'react-redux';
import { changeDrawingStatus } from '../../actions/draw';

import {
    groupsSelector
} from '../../selectors/layers';

createControlEnabledSelector('nearby');
const nearbySelector = (state) => get(state, 'controls.nearby.enabled');

const toggleNearbyTool = toggleControl.bind(null, 'nearby', null);
const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
}

const setRadius = function(radius) {
    return {
        type: 'SET_NEARBY_RADIUS',
        radius: Number(radius) || 1.0
    };
};
const setLayer = function(layer,idx) {
    return {
        type: 'SET_LAYER_FILTER',
        layer: layer,
        index: idx
    }
}
const changeCenter = function(center) {
    return {
        type: 'SET_NEARBY_CENTER',
        center: center
    };
};
const featureLoaded = function(features) {
    return {
        type: 'NEARBY_FEATURE_LOADED',
        features: features
    };
};
const loadFeature = function(radius, center, radiusFeature,layerSelected) {
    if(!layerSelected){
        layerSelected = {}
    }
    const DEFAULT_API = 'https://geonode.longdo.com/geoserver/wfs';
    return (dispatch) => {
        // https://geonode.longdo.com/geoserver/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=geonode%3Aevent2019_Z7Ya8nR&outputFormat=application%2Fjson
        // ?DWithin(${layerType.name},POINT(${center.y}%20,${center.x}),${radius},meters)
        axios.get(layerSelected.url || DEFAULT_API,{
            params: {
                service : 'WFS',
                version: layerSelected.version,
                request: 'DescribeFeatureType',
                typeName: layerSelected.name,
                outputFormat: 'application/json'
            }
        }).then(({ data }) => {
            const layerInfo = data.featureTypes[0]
            try {
               const layerType =  layerInfo.properties.find((layerType) => { return layerType.localType === 'Point'})
               if(layerType.name !== null || layerType.name !== 'undefined'){
                   const positionPoint = center.y+' '+center.x
                   axios.get(`${layerSelected.url || DEFAULT_API}`,{
                       params: {
                        service : 'WFS',
                        version: layerSelected.version,
                        request:'GetFeature',
                        typeNames: layerSelected.name,
                        outputFormat: 'application/json',
                        SRSName:'EPSG:4326',
                        cql_filter: `DWithin(${layerType.name},POINT(${positionPoint}),${radius},meters)`
                       }
                   }).then((response) => {
                    var featuresGeoJson = response.data.features
                    featuresGeoJson.map((geoJson) => {
                        if(geoJson.geometry.type === 'Point'){
                            geoJson['style'] = {
                                    iconGlyph: "map-marker",
                                    iconShape: "circle",
                                    iconColor: "blue",
                                    highlight: false,
                                    id: uuidv1()
                                }
                        }
                    })
                    featuresGeoJson.push(radiusFeature)
                    dispatch(featureLoaded(featuresGeoJson));        
                   })
               }
            } catch (error) {
                console.log(error)
                dispatch(featureLoaded([]));
            }
        }).catch((e) => {
            console.log(e);
            dispatch(featureLoaded([]));
        });
    };
};

const selector = (state) => {
    return {
        radius: state.nearby.radius,
        center: state.nearby.center,
        results: state.nearby.results,
        layer: state.nearby.layer,
        layerIndex: state.nearby.layerIndex
    };
};

const defaultState = {
    radius: 1.0,
    center: null,
    results: [],
    layer: {},
    layerIndex: -1
};
function nearbyReducer(state = defaultState, action) {
    switch (action.type) {
    case 'SET_NEARBY_RADIUS': {
        return assign({}, state, {
            radius: action.radius
        });
    }
    case 'SET_LAYER_FILTER': {
        return assign({},state,{
            layer: action.layer,
            layerIndex: action.index
        })
    }
    case 'SET_NEARBY_CENTER': {
        return assign({}, state, {
            center: action.center
        });
    }
    case 'NEARBY_FEATURE_LOADED': {
        return assign({}, state, {
            results: action.features
        });
    }
    default: {
        return state;
    }
    }
}

class NearbyDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        radius: PropTypes.number,
        results: PropTypes.array,
        onClose: PropTypes.func,
        onChangeRadius: PropTypes.func,
        onChangeLayer: PropTypes.func,
        dockProps: PropTypes.object,
        layersGroups: PropTypes.array,
        layersNode: PropTypes.array,
        layerIndex: PropTypes.number
    };

    static defaultProps = {
        show: false,
        radius: 1.00,
        results: [],
        dockProps: {
            dimMode: "none",
            size: 0.30,
            fluid: true,
            position: "right",
            zIndex: 1030
        },
        dockStyle: {},
        layersGroups: [],
        layersNode: [],
        layerIndex: -1
    };

    onClose = () => {
        this.props.onClose(false);
    };

    onChangeRadius = (radius) => {
        this.props.onChangeRadius(radius);
    };

    onLayerChange = (idx) => {
        const getLayer = this.props.layersNode[idx]
        this.props.onChangeLayer(getLayer,idx)
        this.props.onChangeRadius(1.0);
    };

    start = {
        x: (window.innerWidth - 600) * 0.5,
        y: (window.innerHeight - 100) * 0.5
    }

    dialogStyle = {
        position: 'fixed',
        top: '0px',
        left: '0px'
    };

    renderHeader() {
        return (
            <div style={{ width: '100%' }}>
                <div style={{display: "flex", alignItems: "center"}}>
                    <div>
                        <Button className="square-button no-events">
                            <Glyphicon glyph="record"/>
                        </Button>
                    </div>
                    <div style={{flex: "1 1 0%", padding: 8, textAlign: "center"}}>
                        <h4>Nearby</h4>
                    </div>
                    <div>
                        <Button className="square-button no-border" onClick={this.onClose}>
                            <Glyphicon glyph="1-close"/>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const items =   [];
        for (const [index, value] of this.props.results.entries()) {
            items.push(<li key={index}>{value.properties.title_en || 'No title'}</li>);
        }
        return this.props.show
            ? (
                <ContainerDimensions>
                { ({ width }) =>
                    <span className="react-dock-no-resize">
                        <Dock 
                        fluid 
                        dockStyle={this.props.dockStyle} {...this.props.dockProps}
                        isVisible={this.props.show} 
                        size={330 / width > 1 ? 1 : 330 / width} 
                        >
                            <BorderLayout header={this.renderHeader()}>
                                <div style={{ padding: '10px'}}> 
                                    <label>Layers</label>  
                                        <div>
                                            <LayerSelector
                                                responses={this.props.layersNode}
                                                index={this.props.layerIndex}
                                                setIndex={this.onLayerChange}
                                            ></LayerSelector>
                                        </div>
                                    <label style={{marginTop:'15px'}}>Radius (km)</label>
                                        <div className="mapstore-slider with-tooltip">
                                            <Slider
                                                tooltips
                                                step={0.1}
                                                start={[this.props.radius]}
                                                range={{
                                                    'min': [0],
                                                    'max': [20]
                                                }}
                                                onChange={(value) => { this.onChangeRadius(value[0]); }}
                                            />
                                        </div>
                                    <div>{items}</div>
                                </div>
                             
                            </BorderLayout>
                        </Dock>
                    </span>
                }
               </ContainerDimensions>
            ) : null;
    }
}

const nearby = connect(
    createSelector(
        [
            selector,
            (state) => {
                return nearbySelector(state);
            },
            groupsSelector,
        ],
        (nearbyState, show,layersGroups) => {
            return {
                ...nearbyState,
                show,
                layersGroups,
                layersNode: layerNodesExtracter(layersGroups)
            };
        }
    ),
    {
        onClose: toggleNearbyTool,
        onChangeRadius: setRadius,
        onChangeLayer: setLayer
    },
    null,
    {
        pure: false
    }
)(NearbyDialog);

const changeCenterEpic = (action$, {getState = () => {}}) =>
    action$.ofType('CHANGE_MAP_VIEW')
        .filter(() => {
            return (getState().controls.nearby || {}).enabled || false;
        })
        .switchMap(({center}) => {
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: false,
                translateEnabled: false,
                drawEnabled: false
            };
            const radius = getState().nearby.radius;
            const layer = getState().nearby.layer;
            const geometry = circle(
                [ center.x, center.y ],
                radius,
                {
                    steps: 100,
                    units: 'kilometers'
                }
            ).geometry;

            const feature =  {
                type: "Feature",
                geometry: geometry,
                properties: {
                    isCircle: true,
                    radius: radius,
                    id: uuidv1(),
                    crs: "EPSG:3857",
                    isGeodesic: true
                },
                style: [
                    {
                        color: "#48C9B0",
                        opacity: 1,
                        weight: 5,
                        fillColor: "#ffffff",
                        fillOpacity: 0.3,
                        highlight: false,
                        type: "Circle",
                        title: "Near by",
                        id: uuidv1
                    }
                ]
            }
            return Rx.Observable.from([
                changeCenter(center),
                loadFeature(radius * 1000, center, feature,layer)
            ]);
        });
const changeRadiusEpic = (action$, {getState = () => {}}) =>
    action$.ofType('SET_NEARBY_RADIUS')
        .filter(() => {
            return (getState().controls.nearby || {}).enabled || false;
        })
        .switchMap(({radius}) => {
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: false,
                translateEnabled: false,
                drawEnabled: false
            };

            const center = getState().map.present.center;
            const layer = getState().nearby.layer;
            const geometry = circle(
                [ center.x, center.y ],
                radius,
                {
                    steps: 100,
                    units: 'kilometers'
                }
            ).geometry;

            const feature =  {
                type: "Feature",
                geometry: geometry,
                properties: {
                    isCircle: true,
                    radius: radius,
                    id: uuidv1(),
                    crs: "EPSG:3857",
                    isGeodesic: true
                },
                style: [
                    {
                        color: "#48C9B0",
                        opacity: 1,
                        weight: 5,
                        fillColor: "#ffffff",
                        fillOpacity: 0.3,
                        highlight: false,
                        type: "Circle",
                        title: "Near by",
                        id: uuidv1
                    }
                ]
            }


            return Rx.Observable.from([
                //changeDrawingStatus('drawOrEdit', 'Circle', 'nearby', [feature], drawOptions, style),
                loadFeature(radius * 1000, center,feature,layer)
            ]);
        });

const nearbyResultLoadedEpic = (action$, {getState = () => {}}) =>
    action$.ofType('NEARBY_FEATURE_LOADED')
        .filter(() => {
            return (getState().controls.nearby || {}).enabled || false;
        })
        .switchMap(({features}) => {
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: true,
                translateEnabled: false,
                drawEnabled: false
            };
            const layerSelected = getState().nearby.layer;
            const featureCollection = [
                {
                    type: "FeatureCollection",
                    newFeature: true,
                    id: uuidv1(),
                    geometry: null,
                    properties: uuidv1(),
                    features: [...features],
                },
            ];
            return Rx.Observable.from([
                changeDrawingStatus('drawOrEdit', 'Point', 'nearbyResult', featureCollection, drawOptions)
            ]);
        });

export default {
    NearbyPlugin: assign(nearby, {
        BurgerMenu: {
            name: 'nearby',
            position: 9,
            panel: false,
            help: 'help',
            tooltip: 'tooltip',
            text: 'Nearby',
            icon: <Glyphicon glyph="record" />,
            action: () => setControlProperty('nearby', 'enabled', true)
        }
    }),
    reducers: {
        nearby: nearbyReducer
    },
    epics: {
        changeCenterEpic,
        changeRadiusEpic,
        nearbyResultLoadedEpic
    }
};