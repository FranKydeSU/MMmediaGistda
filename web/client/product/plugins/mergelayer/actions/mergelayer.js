// -------------------------------------Action--------------------------------------
export const MERGELYR_SET_LAYER_1 = "MERGELYR:SET_LAYER_1";
export const MERGELYR_SET_LAYER_2 = "MERGELYR:SET_LAYER_2";
export const MERGELYR_DO_MERGE = "MERGELYR:DO_MERGE";
export const MERGELYR_SET_LOADING = "MERGELYR:SET_LOADING";
export const MERGELYR_ADD_AS_LAYER = "MERGELYR:ADD_AS_LAYER";
export const MERGELYR_FETCH_FAILURE = "MERGELYR:FETCH_FAILURE";
// ค่าพิื้นฐานที่เรียกใช้คือ TOGGLE_CONTROL -> /reducers/controls.js
export const TOGGLE_CONTROL = 'TOGGLE_CONTROL';

export const setLayer1 = function (idx) {
    return {
        type: MERGELYR_SET_LAYER_1,
        index1: idx
    };
};

export const setLayer2 = function (idx) {
    return {
        type: MERGELYR_SET_LAYER_2,
        index2: idx
    };
};

export const doMerge = function (layerSelected1, layerSelected2) {
    return {
        type: MERGELYR_DO_MERGE,
        layerSelected1,
        layerSelected2
    };
};

export const loading = function (isLoading) {
    return {
        type: MERGELYR_SET_LOADING,
        isLoading
    };
};

export const mergeAsLayer = function (featureCollection) {
    return {
        type: MERGELYR_ADD_AS_LAYER,
        featureCollection
    };
};

export const fetchGeoJsonFailure = function (error) {
    return {
        type: MERGELYR_FETCH_FAILURE,
        error
    };
};

export const toggleMergeLyrTool = function () {
    return {
        type: TOGGLE_CONTROL,
        control: 'mergelyr',
        property: null,
        layerSelected1: {},
        layerSelected2: {},
        layerIndex1: -1,
        layerIndex2: -1,
        loading: false,
        error: ''
    };
};