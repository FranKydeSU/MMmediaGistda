import assign from "object-assign";

// Actions
import {
    BUFFER_SET_LAYER,
    BUFFER_SET_RADIUS,
    BUFFER_SET_UNIT,
    BUFFER_SET_LOADING,
    BUFFER_FETCH_FAILURE,
    TOGGLE_CONTROL,
} from '../actions/buffer'

const defaultState = {
    radius: 1,
    layerIndex: -1,
    unitValue: "kilometers",
    loading: false,
    error: ''
};

export function bufferReducer(state = defaultState, action) {
    switch (action.type) {
        case BUFFER_SET_LAYER: {
            return assign({}, state, {
                layerIndex: action.index,
            });
        }
        case BUFFER_SET_UNIT: {
            return assign({}, state, {
                unitValue: action.unitValue,
            });
        }
        case BUFFER_SET_RADIUS: {
            return assign({}, state, {
                radius: action.radius,
            });
        }
        case BUFFER_SET_LOADING: {
            return assign({}, state, {
                loading: action.isLoading,
            });
        }
        case BUFFER_FETCH_FAILURE: {
            return assign({}, state, {
                error: action.error,
            });
        }
        case TOGGLE_CONTROL: {
            return assign({}, state, {
                layerSelected: action.layerSelected,
                layerIndex: action.layerIndex,
                loading: action.loading,
                error: action.error
            });
        }
        default:
            return state;
    }
}