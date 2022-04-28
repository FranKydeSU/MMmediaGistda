import assign from "object-assign";

const defaultState = {
    displaySetting: false,
    pointList: [
        { lat: null, lon: null, keyword: "", searchResult: {} },
        { lat: null, lon: null, keyword: "", searchResult: {} },
    ],
    features: [],
    routeType: [],
    routeMode: null
};
export function routingReducer(state = defaultState, action) {
    switch (action.type) {
        case "ROUTING_ADD_POINT": {
            if (state.pointList.length >= 2) {
                state.pointList.map((index, i) => {
                    document.getElementById(`btn-rm-${i}`).style.display = null;
                });
            }
            return assign({}, state, {
                pointList: state.pointList.concat([
                    { lat: null, lon: null, keyword: "", searchResult: {} },
                ]),
            });
        }
        case "ROUTING_REMOVE_POINT": {
            if (state.pointList.length === 2) {
                return;
            } else {
                state.pointList.splice(action.index, 1);
                if (state.pointList.length <= 2) {
                    state.pointList.map((index, i) => {
                        document.getElementById(`btn-rm-${i}`).style.display =
                            "none";
                    });
                }
            }
            return assign({}, state, {});
        }
        case "ROUTING_SWAP_POINT": {
            return assign({}, state, {
                pointList: state.pointList.reverse(),
            });
        }
        case "ROUTING_CHANGE_POINT_LIST": {
            const splited = action.value.trim().split(",");
            const lat = splited[0];
            const lon = splited.length > 1 ? splited[1] : null;
            return assign({}, state, {
                pointList: state.pointList.map((point, i) => {
                    return action.index === i
                        ? assign({}, point, {
                            lat: lat,
                            lon: lon,
                            keyword: action.value,
                        })
                        : point;
                }),
            });
        }
        case "ROUTING_DISPLAY_SETTING": {
            return assign({}, state, {
                displaySetting: !state.displaySetting
            })
        }
        case "ROUTING_CHANGE_MODE": {
            return assign({}, state, {
                routeMode: action.value
            })
        }
        case "ROUTING_CHANGE_TYPE": {
            const indexOfRouteType = state.routeType.indexOf(action.value);
            if (indexOfRouteType == -1) {
                return assign({}, state, {
                    routeType: state.routeType.concat(action.value)
                });
            }else {
                return assign({}, state,{
                    routeType:  indexOfRouteType == 0 ? [] : state.routeType.splice(action.value,1)
                })
            }
        }
        case "ROUTING_FEATURE_LOADED": {
            return assign({}, state, {
                features: action.features,
            });
        }
        case "ROUTING_SEARCH_LOADED": {
            return assign({}, state, {
                pointList: state.pointList.map((point, i) => {
                    return action.index === i
                        ? assign({}, point, {
                            searchResult: action.result,
                        })
                        : point;
                }),
            });
        }
        case "ROUTING_CLICK_SEARCH_RESULT": {
            return assign({}, state, {
                pointList: state.pointList.map((point, index) => {
                    return action.i === index
                        ? assign({}, point, {
                            lat: Number(action.result.lat),
                            lon: Number(action.result.lon),
                            keyword: action.result.name,
                            searchResult: [],
                        })
                        : point;
                }),
            });
        }
        case "ROUTING_FEATURE_CLEAR": {
            return assign({}, state, {
                features: [],
                pointList: [
                    { lat: null, lon: null, keyword: "", searchResult: {} },
                    { lat: null, lon: null, keyword: "", searchResult: {} },
                ],
            });
        }
        default: {
            return state;
        }
    }
}