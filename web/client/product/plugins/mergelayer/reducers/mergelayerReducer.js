import assign from 'object-assign';
// Actions
import {
    MERGELYR_SET_LAYER_1,
    MERGELYR_SET_LAYER_2,
    MERGELYR_SET_LOADING,
    MERGELYR_FETCH_FAILURE,
    TOGGLE_CONTROL
} from '../actions/mergelayer'

const defaultState = {
    layerIndex1: -1,
    layerIndex2: -1,
    loading: false,
    error: ''
};

export function mergeLayerReducer(state = defaultState, action) {
    switch (action.type) {
        case MERGELYR_SET_LAYER_1: {
            return assign({}, state, {
                layerIndex1: action.index1
            });
        };
        case MERGELYR_SET_LAYER_2: {
            return assign({}, state, {
                layerIndex2: action.index2
            });
        };
        case MERGELYR_SET_LOADING: {
            return assign({}, state, {
                loading: action.isLoading
            });
        };
        case MERGELYR_FETCH_FAILURE: {
            return assign({}, state, {
                error: action.error
            });
        };
        case TOGGLE_CONTROL: {
            return assign({}, state, {
                layerSelected1: action.layerSelected1,
                layerSelected2: action.layerSelected2,
                layerIndex1: action.layerIndex1,
                layerIndex2: action.layerIndex1,
                loading: action.loading,
                error: action.error
            });
        };
        default:
            return state;
    };
};