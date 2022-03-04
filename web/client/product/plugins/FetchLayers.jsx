
import assign from 'object-assign';
import React from 'react';
import PropTypes from 'prop-types';
import Rx from 'rxjs';

import { get } from 'lodash';
import { createControlEnabledSelector } from '../../selectors/controls';
import { createSelector } from 'reselect';
import { connect } from 'react-redux';

import {
    groupsSelector,
    layerSettingSelector,
    getLayerFromId
} from '../../selectors/layers';
import {
    refreshLayerVersion,
    refreshLayers
} from '../../actions/layers'
createControlEnabledSelector('fetchlayer');
const FetchLayerSelector = (state) => get(state, 'controls.fetchlayer.enabled');

const layerNodesExtracter = (groups) => {
    const layerNode = []
    groups.map(groupNode => {
        layerNode.push(...groupNode.nodes)
    })
    return layerNode
}
const selector = (state) => {
    return {
        layersInterval: state.fetchLayer.layersInterval
    };
};
const setLayerInterval = (intervalObj) => {
    return {
        type: 'FETCH:SET_LAYER_INTERVAL_WORK',
        layer: intervalObj.layer,
        id: intervalObj.id
    };
}
const cancelInterval = (layer) => {
    return {
        type: 'LAYERS:CANCLE_INTERVAL',
        layer: layer
    }
}
const defaultState = {
    layersInterval: [],
};
function fetchLayerReducers(state = defaultState, action) {
    switch (action.type) {
        case 'FETCH:SET_LAYER_INTERVAL_WORK': {
            console.log(state)
            return assign({}, state, {
                layersInterval: state.layersInterval.concat({
                    id: action.id,
                    layer: action.layer
                })
            });
        }
        default: {
            return state;
        }
    }
}
class FetchLayerCmp extends React.Component {
    static propTypes = {
        layerInterval: PropTypes.array,
    };

    static defaultProps = {
        layersInterval: []
    };
    render() {
        return null
    }
}

const fetchLayer = connect(
    createSelector(
        [
            selector,
            (state) => {
                return FetchLayerSelector(state);
            },
            groupsSelector
        ],
        (fetchLayerState, show, layersGroups) => {
            return {
                ...fetchLayerState,
                show,
                layersGroups,
                layers: layerNodesExtracter(layersGroups)
            };
        }
    ),
    {},
    null,
    {
        pure: false
    }
)(FetchLayerCmp);
const updateSettingParamsEpic = (action$, store) =>
    action$.ofType('LAYERS:UPDATE_SETTINGS_PARAMS')
        .switchMap(({ newParams = {}, update }) => {
            const state = store.getState();
            const settings = layerSettingSelector(state);
            const layer = settings?.nodeType === 'layers' ? getLayerFromId(state, settings?.node) : null;
            if (newParams.timeInterval !== null && newParams.timeInterval && newParams.timeInterval !== 'Naver') {
                const layerInterval = store.getState().fetchLayer.layersInterval
                const timeInterval = newParams.timeInterval;
                // const layerIdx = layerInterval.findIndex(layerWorking => layerWorking.layer.id === layer.id)
                // console.log(layerIdx)
                // if (layerIdx == -1) {
                return Rx.Observable.interval(Number.parseInt(timeInterval) * 1000)
                    .map(() =>
                        refreshLayerVersion(layer.id)
                    )
                    .takeUntil(action$.filter(x => (x.type === 'LAYERS:CANCLE_INTERVAL' && x.layer.id == layer.id)))

                // }
            } else {
                return Rx.Observable.from([
                    cancelInterval(layer)
                ])
            }
            // if (newParams.timeInterval !== null && newParams.timeInterval) {
            //     const layerIntervalList = store.getState().fetchLayer.layersInterval;
            //     const timeInterval = newParams.timeInterval;
            //     const findLayerIntervalByIndex = layerIntervalList.findIndex(layerWorking => layerWorking.layer.id === layer.id)
            //     if (findLayerIntervalByIndex == -1) {

            //         // const intervalId = setInterval(() => {
            //         //     // Do some thing
            //         //     return Rx.Observable.from([
            //         //             refreshLayerVersion(layer.id)
            //         //         ]);
            //         // }, Number.parseInt(timeInterval) * 1000)
            //         // console.log(intervalId)
            //         return Rx.Observable.interval(5000).map((value)=>{
            //             refreshLayerVersion(layer.id)
            //         }).takeUntil(action$.ofType('LAYERS:CANCLE_INTERVAL'))
            //         // return Rx.Observable.interval(5000).subscribe(() => {

            //         // })
            //         // return Rx.Observable.from([
            //         //     refreshLayerVersion(layer.id)
            //         // ]);
            //     }else{        
            //         if(timeInterval !== 'Naver'){
            //         const intervalId = setInterval(() => {

            //             }, Number.parseInt(timeInterval) * 1000)
            //         return Rx.Observable.from([
            //                 setLayerInterval({
            //                     id: intervalId,
            //                     layer: layer
            //                 })
            //             ]);
            //         }else{
            //             // clearInterval(layerIntervalList[findLayerIntervalByIndex].id)
            //             return Rx.Observable.from([
            //                 cancelInterval()
            //             ])
            //         }
            //     }
            // }
            // return Rx.Observable.from([
            //     refreshLayerVersion(layer.id)
            // ])
        })
export default {
    FetchLayersPlugin: assign(fetchLayer, {}),
    reducers: {
        fetchLayer: fetchLayerReducers
    },
    epics: {
        updateSettingParamsEpic
    }
};