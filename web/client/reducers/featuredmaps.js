/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MAPS_LIST_LOADING, FEATURED_MAPS_SET_ENABLED, INVALIDATE_FEATURED_MAPS } from '../actions/maps';

import { set } from '../utils/ImmutableUtils';

function featuredmaps(state = {}, action) {
    switch (action.type) {
    case MAPS_LIST_LOADING: {
        return {...state,
            searchText: action.searchText
        };
    }
    case FEATURED_MAPS_SET_ENABLED: {
        return set("enabled", action.enabled, state);
    }
    case INVALIDATE_FEATURED_MAPS: {
        return set("invalidate", !state.invalidate, state);
    }
    default:
        return state;
    }
}
export default featuredmaps;
