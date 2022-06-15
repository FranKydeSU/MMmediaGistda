export const BUFFER_SET_LAYER = "BUFFER:SET_LAYER";
export const BUFFER_SET_RADIUS = "BUFFER:SET_RADIUS";
export const BUFFER_SET_UNIT = "BUFFER:SET_UNIT";
export const BUFFER_DO_BUFFER = "BUFFER:DO_BUFFER";
export const BUFFER_ADD_AS_LAYER = "BUFFER:ADD_AS_LAYER";
export const BUFFER_SET_LOADING = "BUFFER:SET_LOADING";
export const BUFFER_FETCH_FAILURE = "BUFFER:FETCH_FAILURE";
// ค่าพิื้นฐานที่เรียกใช้คือ TOGGLE_CONTROL -> /reducers/controls.js
export const TOGGLE_CONTROL = "TOGGLE_CONTROL";

export const setLayer = function (idx) {
    return {
        type: BUFFER_SET_LAYER,
        index: idx,
    };
};

export const setRadius = function (radius) {
    return {
        type: BUFFER_SET_RADIUS,
        radius,
    };
};

export const setUnit = function (unit) {
    return {
        type: BUFFER_SET_UNIT,
        unitValue: unit,
    };
};

export const doBuffer = function (layerSelected) {
    return {
        type: BUFFER_DO_BUFFER,
        layerSelected,
    };
};

export const addAsLayer = function (bufferedFtCollection) {
    console.log("add layer to panel", bufferedFtCollection);
    return {
        type: BUFFER_ADD_AS_LAYER,
        bufferedFtCollection,
    };
};

export const loading = function (isLoading) {
    return {
        type: BUFFER_SET_LOADING,
        isLoading,
    };
};

export const fetchGeoJsonFailure = function (error) {
    console.log("fetchGeoJsonFailure", error);
    return {
        type: BUFFER_FETCH_FAILURE,
        error,
    };
};

export const toggleBufferTool = () => {
    return {
        type: TOGGLE_CONTROL,
        control: "buffer",
        property: null,
        layerSelected: {},
        layerIndex: -1,
        loading: false,
        error: ''
    };
};