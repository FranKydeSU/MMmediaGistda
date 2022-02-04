import uuidv1 from "uuid/v1";
import assign from 'object-assign';
import React from 'react';
import { connect } from 'react-redux';
import Rx from 'rxjs';
import { createSelector } from 'reselect';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import Dialog from '../../components/misc/Dialog';
import Slider from 'react-nouislider';
import { setControlProperty, toggleControl } from '../../actions/controls';
import { Glyphicon } from 'react-bootstrap';
import { createControlEnabledSelector } from '../../selectors/controls';
import circle from '@turf/circle';
import { changeDrawingStatus } from '../../actions/draw';
import axios from '../../libs/ajax';

createControlEnabledSelector('nearby');
const nearbySelector = (state) => get(state, 'controls.nearby.enabled');
const toggleNearbyTool = toggleControl.bind(null, 'nearby', null);

const setRadius = function(radius) {
    return {
        type: 'SET_NEARBY_RADIUS',
        radius: Number(radius) || 1.0
    };
};
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
const loadFeature = function(radius, center, radiusFeature) {
    return (dispatch) => {
        return axios.get(
            `https://geonode-d2.longdo.com/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeNames=geonode:event2020_en&outputFormat=application/json&cql_filter=DWithin(location,POINT(${center.y}%20${center.x}),${radius},meters)&SRSName=EPSG:4326`,
        ).then((response) => {
            var featuresGeoJson = response.data.features
            featuresGeoJson.map((geoJson) => {
                if(geoJson.geometry.type === 'Point'){
                    geoJson['style'] = {
                            iconGlyph: "map-marker",
                            iconShape: "square",
                            iconColor: "blue",
                            highlight: false,
                            id: uuidv1()
                        }
                }
            })
            featuresGeoJson.push(radiusFeature)
            dispatch(featureLoaded(featuresGeoJson));
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
        results: state.nearby.results
    };
};

const defaultState = {
    radius: 1.0,
    center: null,
    results: []
};
function nearbyReducer(state = defaultState, action) {
    switch (action.type) {
    case 'SET_NEARBY_RADIUS': {
        return assign({}, state, {
            radius: action.radius
        });
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
        onChangeRadius: PropTypes.func
    };

    static defaultProps = {
        show: false,
        radius: 1.00,
        results: []
    };

    onClose = () => {
        this.props.onClose(false);
    };

    onChangeRadius = (radius) => {
        this.props.onChangeRadius(radius);
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

    render() {
        const items = [];
        for (const [index, value] of this.props.results.entries()) {
            items.push(<li key={index}>{value.properties.title_en}</li>);
        }

        return this.props.show
            ? (
                <Dialog id="nearby-dialog" style={this.dialogStyle} start={this.start}>
                    <div key="header" role="header">
                        <Glyphicon glyph="search"/>&nbsp;Nearby
                        <button key="close" onClick={this.onClose} className="close"><Glyphicon glyph="1-close" /></button>
                    </div>
                    <div key="body" role="body">
                        <label>Radius (km)</label>
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
                </Dialog>
            ) : null;
    }
}

const nearby = connect(
    createSelector(
        [
            selector,
            (state) => {
                return nearbySelector(state);
            }
        ],
        (nearbyState, show) => {
            return {
                ...nearbyState,
                show
            };
        }
    ),
    {
        onClose: toggleNearbyTool,
        onChangeRadius: setRadius
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
                changeCenter(center),
                loadFeature(radius * 1000, center, feature)
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
                loadFeature(radius * 1000, center,feature)
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
            icon: <Glyphicon glyph="search"/>,
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