import uuidv1 from 'uuid/v1';
import assign from 'object-assign';
import React from 'react';
import { connect } from 'react-redux';
import Rx from 'rxjs';
import { createSelector } from 'reselect';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import Dialog from '../../components/misc/Dialog';
import Loader from '../../components/misc/Loader';
import { setControlProperty, toggleControl } from '../../actions/controls';
import { Glyphicon } from 'react-bootstrap';
import { createControlEnabledSelector } from '../../selectors/controls';
import { changeDrawingStatus } from '../../actions/draw';
import { zoomToExtent } from '../../actions/map';
const axios = require('axios')
const instance = axios.create();

createControlEnabledSelector('routing');
const routingSelector = (state) => get(state, 'controls.routing.enabled');
const toggleRoutingTool = toggleControl.bind(null, 'routing', null);

const featureLoaded = function (features) {
    return {
        type: 'ROUTING_FEATURE_LOADED',
        features: features
    };
};
const clearSearchRouting = function (props) {
    return {
        type: 'ROUTING_FEATURE_CLEAR',
        features: props.features
    };
}
const addPoint = function () {
    return {
        type: 'ROUTING_ADD_POINT'
    };
};
const removePoint = (index) => {
    return {
        type: 'ROUTING_REMOVE_POINT',
        index: index
    };
}
const searchRouting = (pointList) => {
    if (!pointList[0].lon || !pointList[1].lon) {
        document.getElementById('find-route').innerHTML = 'ค้นหาเส้นทาง'
        return
    }
    return (dispatch) => {
        let geoJsonData = new Promise((resolve, reject) => {
            setTimeout(() => {
                let getRoutePath = instance.get('https://api.longdo.com/RouteService/geojson/route', {
                    params: {
                        flon: pointList[0].lon,
                        flat: pointList[0].lat,
                        tlon: pointList[1].lon,
                        tlat: pointList[1].lat,
                        locale: 'th',
                        key: '98034a5f21623ae53d3802af7b86fddf'
                    }
                })
                resolve(getRoutePath);
            }, 2000);
        });
        geoJsonData.then(value => {
            let routeGeoJson = value.data.features
            let routeLengthObj = routeGeoJson.length
            let lastRouteCoordinates = routeGeoJson[routeLengthObj - 1].geometry.coordinates.length
            let lastRouteLon = routeGeoJson[routeLengthObj - 1].geometry.coordinates[lastRouteCoordinates - 1][0]
            let lastRouteLat = routeGeoJson[routeLengthObj - 1].geometry.coordinates[lastRouteCoordinates - 1][1]
            if (pointList.length === 2) {
                routeGeoJson.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            routeGeoJson[0].geometry.coordinates[0][0],
                            routeGeoJson[0].geometry.coordinates[0][1]
                        ]
                    }
                })
                routeGeoJson.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            lastRouteLon,
                            lastRouteLat
                        ]
                    }
                })
                dispatch(featureLoaded(routeGeoJson));
                document.getElementById('find-route').innerHTML = 'ค้นหาเส้นทาง'
            } else {
                routeGeoJson.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            routeGeoJson[0].geometry.coordinates[0][0],
                            routeGeoJson[0].geometry.coordinates[0][1]
                        ]
                    }
                })
                routeGeoJson.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            lastRouteLon,
                            lastRouteLat
                        ]
                    }
                })
                for (let i = 2; i < pointList.length; i++) {
                    const getMoreGeoJsonData = new Promise((resolve, reject) => {
                        setTimeout(() => {
                            let getRoutePath = instance.get('https://api.longdo.com/RouteService/geojson/route', {
                                params: {
                                    flon: lastRouteLon,
                                    flat: lastRouteLat,
                                    tlon: pointList[i].lon,
                                    tlat: pointList[i].lat,
                                    locale: 'th',
                                    key: '98034a5f21623ae53d3802af7b86fddf'
                                }
                            })
                            resolve(getRoutePath);
                        }, 2000);
                    })
                    getMoreGeoJsonData.then((value) => {
                        // console.log(`BEFORE SET LAST ROUTE : ${lastRouteLon} - ${lastRouteLat}`)
                        lastRouteCoordinates = value.data.features[value.data.features.length - 1].geometry.coordinates.length
                        lastRouteLon = value.data.features[value.data.features.length - 1].geometry.coordinates[lastRouteCoordinates - 1][0]
                        lastRouteLat = value.data.features[value.data.features.length - 1].geometry.coordinates[lastRouteCoordinates - 1][1]
                        // console.log(`AFTER SET LAST ROUTE : ${lastRouteLon} - ${lastRouteLat}`)
                        // console.log(`BEFORE PUSH NEW FEATURE ${routeGeoJson.length}`)
                        routeGeoJson.push({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    lastRouteLon,
                                    lastRouteLat
                                ]
                            }
                        })
                        routeGeoJson.push(...value.data.features)
                        // console.log(`AFTER PUSH NEW FEATURE ${routeGeoJson.length}`)
                        if (i + 1 === pointList.length) {
                            dispatch(featureLoaded(routeGeoJson));
                            document.getElementById('find-route').innerHTML = 'ค้นหาเส้นทาง'
                        }
                    })
                }
            }
        })
    }
}

const changePointInput = function (index, value) {
    return {
        type: 'ROUTING_CHANGE_POINT_LIST',
        index: index,
        value: value
    };
};

const clickGuide = function (value) {
    return {
        type: 'ROUTING_CLICK_GUIDE',
        value: value
    };
};

const clickSearchResult = function (i, j, result) {
    return {
        type: 'ROUTING_CLICK_SEARCH_RESULT',
        i,
        j,
        result
    };
};

const searchLoaded = function (index, result) {
    return {
        type: 'ROUTING_SEARCH_LOADED',
        index: index,
        result: result
    };
};
const searchPointForRouting = function (index, value, center) {
    return (dispatch) => {
        return instance.get(
            `https://search.longdo.com/mapsearch/json/search?lat=${center.x}&lon=${center.y}&keyword=${value}&locale=th&key=98034a5f21623ae53d3802af7b86fddf`
        ).then((response) => {
            dispatch(searchLoaded(index, response.data));
        });
    };
};

const selector = (state) => {
    return {
        pointList: state.routing.pointList,
        features: state.routing.features
    };
};

const defaultState = {
    pointList: [{ lat: null, lon: null, keyword: '', searchResult: {} }, { lat: null, lon: null, keyword: '', searchResult: {} }],
    features: []
};
function routingReducer(state = defaultState, action) {
    switch (action.type) {
        case 'ROUTING_ADD_POINT': {
            if (state.pointList.length >= 2) {
                state.pointList.map((index, i) => {
                    document.getElementById(`btn-rm-${i}`).style.display = null
                })
            }
            return assign({}, state, {
                pointList: state.pointList.concat([{ lat: null, lon: null, keyword: '', searchResult: {} }])
            });
        }
        case 'ROUTING_REMOVE_POINT': {
            if (state.pointList.length === 2) {
                return
            } else {
                state.pointList.splice(action.index, 1)
                if (state.pointList.length <= 2) {
                    state.pointList.map((index, i) => {
                        document.getElementById(`btn-rm-${i}`).style.display = 'none'
                    })
                }
            }
            return assign({}, state, {});
        }
        case 'ROUTING_CHANGE_POINT_LIST': {
            const splited = action.value.trim().split(',');
            const lat = splited[0];
            const lon = splited.length > 1 ? splited[1] : null;
            return assign({}, state, {
                pointList: state.pointList.map((point, i) => {
                    return action.index === i
                        ? assign({}, point, {
                            lat: lat,
                            lon: lon,
                            keyword: action.value
                        })
                        : point;
                })
            });
        }
        case 'ROUTING_FEATURE_LOADED': {
            return assign({}, state, {
                features: action.features
            });
        }
        case 'ROUTING_SEARCH_LOADED': {
            return assign({}, state, {
                pointList: state.pointList.map((point, i) => {
                    return action.index === i
                        ? assign({}, point, {
                            searchResult: action.result
                        })
                        : point;
                })
            });
        }
        case 'ROUTING_CLICK_SEARCH_RESULT': {
            return assign({}, state, {
                pointList: state.pointList.map((point, index) => {
                    return action.i === index
                        ? assign({}, point, {
                            lat: Number(action.result.lat),
                            lon: Number(action.result.lon),
                            keyword: action.result.name,
                            searchResult: []
                        })
                        : point;
                })
            });
        }
        case 'ROUTING_FEATURE_CLEAR': {
           return assign({}, state, {
                features: [],
                pointList: [{ lat: null, lon: null, keyword: '', searchResult: {} }, { lat: null, lon: null, keyword: '', searchResult: {} }]
            });
        }
        default: {
            return state;
        }
    }
}

class RoutingDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        loading: PropTypes.bool,
        pointList: PropTypes.array,
        features: PropTypes.array,
        onClose: PropTypes.func,
        onAddPoint: PropTypes.func,
        onRemovePoint: PropTypes.func,
        onSearch: PropTypes.func,
        onChangePointInput: PropTypes.func,
        onClickGuide: PropTypes.func,
        onClickSearchResult: PropTypes.func
    };

    static defaultProps = {
        show: false,
        loading: false,
        pointList: [{ lat: null, lon: null }, { lat: null, lon: null }],
        features: []
    };

    onClose = () => {
        this.props.onClose(false);
    };

    onAddPoint = () => {
        this.props.onAddPoint();
    };
    onRemovePoint = (index) => {
        return () => {
            this.props.onRemovePoint(index)
        }
    }

    onSearch = () => {
        document.getElementById('find-route').innerHTML = 'กำลังค้นหา...'
        this.props.onSearch(this.props.pointList);
    };
    onClearSearch = () => {
        this.props.onClearSearch(this.props)
    }

    onChangePointInput = (index) => {
        return (e) => {
            this.props.onChangePointInput(index, e.nativeEvent.target.value);
        };
    };

    onClickGuide = (value) => {
        return () => {
            this.props.onClickGuide(value);
        };
    };

    onClickSearchResult = (i, j, result) => {
        return () => {
            this.props.onClickSearchResult(i, j, result);
        };
    };

    renderEastimateTime = (time) => {
        var hrs = ~~(time / 3600);
        var mins = ~~((time % 3600) / 60);
        var secs = ~~time % 60;
        var ret = "";
        if (hrs > 0) {
            ret += "" + hrs + " ชั่วโมง " + (mins < 10 ? "0" : "");
        }
        ret += "" + mins + " นาที ";
        return (<div class="panel-heading">{ret}</div>)
    }

    renderGuideList = (guideList, time) => {
        return (
            <div>
                <div class="panel panel-primary" style={{ marginTop: '10px' }}>
                    {this.renderEastimateTime(time)}
                    <div class="panel-body">
                        <div style={this.routingGuideList} key="routing-guide">{guideList}</div>
                    </div>
                </div>
            </div>
        )
    }
    renderLoading = () => {
        return (<div className="loading"><Loader size={176} /></div>);
    }

    start = {
        x: (window.innerWidth - 600) * 0.5,
        y: (window.innerHeight - 500) * 0.5
    }

    dialogStyle = {
        position: 'fixed',
        top: '0px',
        left: '0px'
    };

    routingGuideList = {
        marginTop: '10px',
        maxHeight: '300px',
        paddingRight: '10px',
        overflow: 'auto'
    };

    guideStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        cursor: 'pointer'
    };

    turnStyle = {
        width: '36px',
        height: '36px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '12px 0px'
    };

    turnImageStyle = {
        width: '16px',
        height: '16px'
    };

    distanceStyle = {
        marginLeft: 'auto'
    };

    resultListStyle = {
        borderLeft: '2px solid #dddddd',
        borderRight: '2px solid #dddddd',
        position: 'absolute',
        background: 'white',
        maxHeight: '300px',
        overflowY: 'auto',
        width: '94.5%',
        zIndex: 10,
        marginTop: '6.5%'
    };
    resultListStyleWithRemove = {
        borderLeft: '2px solid #dddddd',
        borderRight: '2px solid #dddddd',
        position: 'absolute',
        background: 'white',
        maxHeight: '300px',
        overflowY: 'auto',
        width: '89.5%',
        marginTop: '6.5%',
        zIndex: '10'
    };


    resultStyle = {
        padding: '6px 12px',
        cursor: 'pointer'
    }

    render() {
        const pointList = [];
        for (const [index, value] of this.props.pointList.entries()) {
            const placeholderText = `${index == 0 ? 'กำหนดจุดเริ่มต้น' : 'เลือกจุดหมาย'}`
            const keyword = value.keyword;
            const results = value.searchResult.data || [];
            const resultList = [];
            for (const [i, result] of results.entries()) {
                resultList.push(<div style={this.resultStyle} key={`result-${i}-input-${index}`} onClick={this.onClickSearchResult(index, i, result)}>{result.name}</div>);
            }
            pointList.push(<div style={{ position: 'relative' }}>
                <div key={`point-${index + 1}`} className="input-group">
                    <span className="input-group-addon" style={{ border: 'none', background: 'none' }}>
                        {index === 0 ? <Glyphicon glyph="pushpin" /> : <Glyphicon glyph="record" />}
                    </span>
                    <input type="text" key={`point-input-${index + 1}`} value={keyword} className="form-control" style={{ marginTop: '7px' }} onChange={this.onChangePointInput(index)} placeholder={placeholderText} />
                    <div style={index >= 2 ? this.resultListStyleWithRemove : this.resultListStyle}>{resultList}</div>
                    {index >= 2 ? (<span onClick={this.onRemovePoint(index)} className='input-group-addon' id={`btn-rm-${index}`} style={{ border: 'none', background: 'none' }}><Glyphicon glyph="remove" /></span>) : (<span className='input-group-addon' onClick={this.onRemovePoint(index)} id={`btn-rm-${index}`} style={{ display: 'none', border: 'none', background: 'none' }}><Glyphicon glyph="remove" /></span>)}
                </div>
            </div>);
        }

        const guideList = [];
        var eastimateTime = 0.00;
        for (const [index, value] of this.props.features.entries()) {
            if (value.geometry.type !== 'LineString') {
                continue;
            }
            eastimateTime += value.properties.interval
            const src = `https://api.longdo.com/RouteService/images/turn${value.properties.turn}.png`;
            const d = value.properties.distance < 1000 ? `${value.properties.distance} m` : `${(value.properties.distance / 1000.0).toFixed(1)} km`;
            guideList.push(<div className="routing-guide" style={this.guideStyle} onClick={this.onClickGuide(value)}>
                <div className="turn" style={this.turnStyle}>
                    <img style={this.turnImageStyle} src={src} />
                </div>
                <div className="detail">{value.properties.name}</div>
                <div className="distance" style={this.distanceStyle}>{d}</div>
            </div>);
        }

        return this.props.show
            ? (
                <Dialog id="routing-dialog" style={this.dialogStyle} start={this.start}>
                    <div key="routing-header" role="header">
                        <Glyphicon glyph="search" />&nbsp;Routing
                        <button key="close" onClick={this.onClose} className="close"><Glyphicon glyph="1-close" /></button>
                    </div>
                    <div key="routing-body" role="body">
                        {pointList}
                        <br />
                        <div style={{ display: 'flex', 'justifyContent': 'space-between' }}>
                            <div>
                                <button key="add-point" className="btn btn-londo-circle-sm" onClick={this.onAddPoint}><Glyphicon glyph="plus" /></button>
                                <button key="swap-point" className="btn btn-londo-circle-sm" style={{ marginLeft: '5px' }}><Glyphicon glyph="sort" /></button>
                                <button key="setting" className="btn btn-londo-circle-sm" style={{ marginLeft: '5px' }}><Glyphicon glyph="cog" /></button>
                            </div>
                            <div>
                                <button key="clear-routing" onClick={this.onClearSearch} className="btn btn-longdo-outline-default btn-rounded" style={{ minWidth: '90px', marginRight: '5px' }}>ล้าง</button>
                                <button key="search-routing" onClick={this.onSearch} className="btn btn-longdo-outline-info btn-rounded" style={{ minWidth: '100px' }} id="find-route">ค้นหาเส้นทาง</button>
                            </div>
                        </div>
                        {guideList.length !== 0 ? this.renderGuideList(guideList, eastimateTime) : (<div></div>)}
                    </div>
                </Dialog>
            ) : null;
    }
}

const routing = connect(
    createSelector(
        [
            selector,
            (state) => {
                return routingSelector(state);
            }
        ],
        (routingState, show) => {
            return {
                ...routingState,
                show
            };
        }
    ),
    {
        onClose: toggleRoutingTool,
        onAddPoint: addPoint,
        onRemovePoint: removePoint,
        onSearch: searchRouting,
        onClearSearch: clearSearchRouting,
        onChangePointInput: changePointInput,
        onClickGuide: clickGuide,
        onClickSearchResult: clickSearchResult
    },
    null,
    {
        pure: false
    }
)(RoutingDialog);

const routingResultLoadedEpic = (action$, { getState = () => { } }) =>
    action$.ofType('ROUTING_FEATURE_LOADED')
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ features }) => {
            const drawOptions = {
                featureProjection: "EPSG:4326",
                stopAfterDrawing: true,
                editEnabled: false,
                selectEnabled: true,
                translateEnabled: false,
                drawEnabled: false
                // useSelectedStyle: true
            };

            const style = {
                highlight: false
            };

            let locationList = [];
            features.forEach(f => {
                locationList = locationList.concat(
                    f.geometry.coordinates.map(c => {
                        return {
                            lat: c[1],
                            lon: c[0]
                        };
                    })
                );
            });
            const bbox = window.longdo.Util.locationBound(locationList);
            return Rx.Observable.from([
                changeDrawingStatus("clean", "", "routingResult", [], {}),
                changeDrawingStatus('drawOrEdit', 'LineString', 'routingResult', features, drawOptions, style),
                // changeDrawingStatus('drawOrEdit', 'Point', 'routingPointResult', features, drawOptions, style),
                zoomToExtent(
                    [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat],
                    'EPSG:4326',
                    20,
                    { nearest: true }
                )
            ]);
        });
const clearRoutingResult = (action$, { getState = () => { } }) =>
    action$.ofType('ROUTING_FEATURE_CLEAR')
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(() => {
            const minLon = 92.60906919836998;
            const maxLon = 108.42938169836998;
            const minLat = 9.474313896973175;
            const maxLat = 17.87765599507482;
            return Rx.Observable.from([
                changeDrawingStatus("clean", "", "routingResult", [], {}),
                zoomToExtent(
                    [minLon, minLat, maxLon, maxLat],
                    'EPSG:4326',
                    20,
                    { nearest: true }
                )
            ]);
        });

const routingClickGuideEpic = (action$, { getState = () => { } }) =>
    action$.ofType('ROUTING_CLICK_GUIDE')
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ value }) => {
            console.log(value);

            let locationList = value.geometry.coordinates.map(c => {
                return {
                    lat: c[1],
                    lon: c[0]
                };
            });
            const bbox = window.longdo.Util.locationBound(locationList);

            return Rx.Observable.from([
                // zoomToPoint(
                zoomToExtent(
                    [bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat],
                    'EPSG:4326',
                    20,
                    { nearest: true }
                )
            ]);
        });

const routingChangePointInputEpic = (action$, { getState = () => { } }) =>
    action$.ofType('ROUTING_CHANGE_POINT_LIST')
        .debounceTime(300)
        .filter(() => {
            return (getState().controls.routing || {}).enabled || false;
        })
        .switchMap(({ index, value }) => {
            const center = getState().map.present.center;
            return Rx.Observable.from([
                searchPointForRouting(index, value, center)
            ]);
        });

export default {
    RoutingPlugin: assign(routing, {
        BurgerMenu: {
            name: 'routing',
            position: 9,
            panel: false,
            help: 'help',
            tooltip: 'tooltip',
            text: 'Routing',
            icon: <Glyphicon glyph="search" />,
            action: () => setControlProperty('routing', 'enabled', true)
        }
    }),
    reducers: {
        routing: routingReducer
    },
    epics: {
        routingResultLoadedEpic,
        routingClickGuideEpic,
        routingChangePointInputEpic,
        clearRoutingResult
    }
};