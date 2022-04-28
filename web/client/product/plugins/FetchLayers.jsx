
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
        .flatMap(({ newParams = {}, update }) => {
            const state = store.getState();
            const settings = layerSettingSelector(state);
            const layer = settings?.nodeType === 'layers' ? getLayerFromId(state, settings?.node) : null;
            if (newParams.timeInterval !== null && newParams.timeInterval && newParams.timeInterval !== 'Naver') {
                const timeInterval = (Number.parseInt(newParams.timeInterval) * 1000) || 1000;
                return Rx.Observable.interval(timeInterval)
                    .map(() =>
                        refreshLayerVersion(layer.id)
                    )
                    .takeUntil(action$.filter(x => (x.type === 'LAYERS:CANCLE_INTERVAL' && x.layer.id == layer.id)))
            } else {
                return Rx.Observable.from([
                    cancelInterval(layer)
                ])
            }
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