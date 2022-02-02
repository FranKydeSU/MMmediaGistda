/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import * as Rx from 'rxjs';
import { get, isArray } from 'lodash';
import assign from 'object-assign';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import MediaQuery from 'react-responsive';
import { createSelector } from 'reselect';

import { removeAdditionalLayer } from '../../actions/additionallayers';
import { configureMap } from '../../actions/config';
import { toggleControl } from '../../actions/controls';
import { zoomToExtent } from '../../actions/map';

import {
    TEXT_SEARCH_STARTED,
    TEXT_SEARCH_RESULTS_PURGE,
    TEXT_SEARCH_RESET,
    TEXT_SEARCH_ITEM_SELECTED,
    searchTextLoading,
    searchResultLoaded,
    searchResultError,
    addMarker,
    cancelSelectedItem,
    changeActiveSearchTool,
    changeCoord,
    changeFormat,
    resetSearch,
    resultsPurge,
    searchTextChanged,
    selectSearchItem,
    showGFI,
    textSearch,
    updateResultsStyle,
    zoomAndAddPoint
} from '../../actions/search';

import {API} from '../../api/searchText';

import { setSearchBookmarkConfig } from '../../actions/searchbookmarkconfig';
import SearchBarComp from '../../components/mapcontrols/search/SearchBar';
import SearchResultListComp from '../../components/mapcontrols/search/SearchResultList';
import {
    searchItemSelected,
    searchOnStartEpic,
    textSearchShowGFIEpic,
    zoomAndAddPointEpic
} from '../../epics/search';
import mapInfoReducers from '../../reducers/mapInfo';
import searchReducers from '../../reducers/search';
import { layersSelector } from '../../selectors/layers';
import { mapSelector } from '../../selectors/map';
import ConfigUtils from '../../utils/ConfigUtils';
import { defaultIconStyle } from '../../utils/SearchUtils';
import ToggleButton from '../../plugins/searchbar/ToggleButton'
import uuidv1 from "uuid/v1";
const axios = require('axios')
const instance = axios.create();

const LONGDO_API_KEY = "98034a5f21623ae53d3802af7b86fddf"

const searchSelector = createSelector([
    state => state.search || null,
    state => state.controls && state.controls.searchBookmarkConfig || null,
    state => state.mapConfigRawData || {},
    state => state?.searchbookmarkconfig || ''
], (searchState, searchBookmarkConfigControl, mapInitial, bookmarkConfig) => ({
    enabledSearchBookmarkConfig: searchBookmarkConfigControl && searchBookmarkConfigControl.enabled || false,
    error: searchState && searchState.error,
    coordinate: searchState && searchState.coordinate || {},
    loading: searchState && searchState.loading,
    searchText: searchState ? searchState.searchText : "",
    activeSearchTool: get(searchState, "activeSearchTool", "addressSearch"),
    format: get(searchState, "format") || ConfigUtils.getConfigProp("defaultCoordinateFormat"),
    selectedItems: searchState && searchState.selectedItems,
    mapInitial,
    bookmarkConfig: bookmarkConfig || {}
}));

const SearchBar = connect(searchSelector, {
    onSearch: textSearch,
    onChangeCoord: changeCoord,
    onChangeActiveSearchTool: changeActiveSearchTool,
    onClearCoordinatesSearch: removeAdditionalLayer,
    onClearBookmarkSearch: setSearchBookmarkConfig,
    onChangeFormat: changeFormat,
    onToggleControl: toggleControl,
    onZoomToPoint: zoomAndAddPoint,
    onPurgeResults: resultsPurge,
    onSearchReset: resetSearch,
    onSearchTextChange: searchTextChanged,
    onCancelSelectedItem: cancelSelectedItem,
    onZoomToExtent: zoomToExtent,
    onLayerVisibilityLoad: configureMap
})(SearchBarComp);

const selector = createSelector([
    mapSelector,
    layersSelector,
    state => state.search || null
], (mapConfig, layers, searchState) => ({
    mapConfig,
    layers,
    results: searchState ? searchState.results : null
}));

const SearchResultList = connect(selector, {
    onItemClick: selectSearchItem,
    addMarker,
    showGFI
})(SearchResultListComp);

const SearchPlugin = connect((state) => ({
    enabled: state.controls && state.controls.search && state.controls.search.enabled || false,
    selectedServices: state && state.search && state.search.selectedServices,
    selectedItems: state && state.search && state.search.selectedItems,
    textSearchConfig: state && state.searchconfig && state.searchconfig.textSearchConfig
}), {
    onUpdateResultsStyle: updateResultsStyle
})(
    class extends React.Component {
        static propTypes = {
            splitTools: PropTypes.bool,
            showOptions: PropTypes.bool,
            isSearchClickable: PropTypes.bool,
            fitResultsToMapSize: PropTypes.bool,
            searchOptions: PropTypes.object,
            resultsStyle: PropTypes.object,
            selectedItems: PropTypes.array,
            selectedServices: PropTypes.array,
            userServices: PropTypes.array,
            withToggle: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
            enabled: PropTypes.bool,
            textSearchConfig: PropTypes.object
        };

        static defaultProps = {
            searchOptions: {
                services: [{ type: "nominatim", priority: 5 }]
            },
            isSearchClickable: false,
            splitTools: true,
            resultsStyle: {
                color: '#3388ff',
                weight: 4,
                dashArray: '',
                fillColor: '#3388ff',
                fillOpacity: 0.2
            },
            fitResultsToMapSize: true,
            withToggle: false,
            enabled: true
        };

        componentDidMount() {
            this.props.onUpdateResultsStyle({ ...defaultIconStyle, ...this.props.resultsStyle });
        }

        getServiceOverrides = (propSelector) => {
            return this.props.selectedItems && this.props.selectedItems[this.props.selectedItems.length - 1] && get(this.props.selectedItems[this.props.selectedItems.length - 1], propSelector);
        };

        getSearchOptions = () => {
            const { searchOptions, textSearchConfig } = this.props;
            if (textSearchConfig && textSearchConfig.services && textSearchConfig.services.length > 0) {
                return textSearchConfig.override ? assign({}, searchOptions, { services: textSearchConfig.services }) : assign({}, searchOptions, { services: searchOptions.services.concat(textSearchConfig.services) });
            }
            return searchOptions;
        };

        getCurrentServices = () => {
            const { selectedServices } = this.props;
            const searchOptions = this.getSearchOptions();
            return selectedServices && selectedServices.length > 0 ? assign({}, searchOptions, { services: selectedServices }) : searchOptions;
        };

        getSearchAndToggleButton = () => {
            const search = (<SearchBar
                key="searchBar"
                {...this.props}
                searchOptions={this.getCurrentServices()}
                placeholder={this.getServiceOverrides("placeholder")}
                placeholderMsgId={this.getServiceOverrides("placeholderMsgId")}
            />);
            if (this.props.withToggle === true) {
                return [<ToggleButton />].concat(this.props.enabled ? [search] : null);
            }
            if (isArray(this.props.withToggle)) {
                return (
                    <span><MediaQuery query={"(" + this.props.withToggle[0] + ")"}>
                        <ToggleButton />
                        {this.props.enabled ? search : null}
                    </MediaQuery>
                        <MediaQuery query={"(" + this.props.withToggle[1] + ")"}>
                            {search}
                        </MediaQuery>
                    </span>
                );
            }
            return search;
        };

        render() {
            return (<span>
                {this.getSearchAndToggleButton()}
                <SearchResultList
                    fitToMapSize={this.props.fitResultsToMapSize}
                    searchOptions={this.props.searchOptions}
                    onUpdateResultsStyle={this.props.onUpdateResultsStyle}
                    key="nominatimresults" />
            </span>)
                ;
        }
    });
export const searchEpic = action$ =>
    action$.ofType(TEXT_SEARCH_STARTED)
        .debounceTime(250)
        .switchMap(action =>
            Rx.Observable.from(
                (action.services || [{ type: "nominatim", priority: 5 }])
                    .map((service) => {
                        const serviceInstance = API.Utils.getService(service.type);
                        const getSearchData = () => {
                            return instance.get(`https://search.longdo.com/mapsearch/json/search?keyword=${action.searchText}&key=${LONGDO_API_KEY}`)
                        }
                        const isSearchByLongdoMap = localStorage.getItem('isLongdoSearch')
                        if (!serviceInstance) {
                            const err = new Error("Service Missing");
                            err.msgId = "search.service_missing";
                            err.serviceType = service.type;
                            return Rx.Observable.of(err).do((e) => {throw e; });
                        }
                        return Rx.Observable.defer(() =>
                            isSearchByLongdoMap === 'true' ? 
                            getSearchData().then(({data}) => {
                               let response = data.data
                               let responseFormat = []
                               response.map((list) => {
                                    responseFormat.push({
                                        "properties": {
                                            "place_id": list.id,
                                            "display_name": list.name,
                                            "icon": "https://nominatim.openstreetmap.org/ui/mapicons//poi_place_village.p.20.png",
                                        },
                                        "id": uuidv1(),
                                        "type": "Feature",
                                        "bbox": [
                                            (list.lon - 0.1),
                                            (list.lat - 0.1),
                                            (list.lon + 0.1),
                                            (list.lat + 0.1),
                                        ],
                                        "geometry": {
                                            "type": "Point",
                                            "coordinates": [
                                                list.lon,
                                                list.lat
                                            ]
                                        }
                                    })
                               })
                               return responseFormat
                            }) : 
                           serviceInstance(action.searchText, service.options)
                                .then( (response = []) => response.map(result => ({...result, __SERVICE__: service, __PRIORITY__: service.priority || 0}))
                                ))
                            .retryWhen(errors => errors.delay(200).scan((count, err) => {
                                if ( count >= 2) {
                                    throw err;
                                }
                                return count + 1;
                            }, 0));
                    }) // Map
            )
            .mergeAll()
            .scan((oldRes, newRes) => sortBy([...oldRes, ...newRes], ["__PRIORITY__"]))
            .map((results) => searchResultLoaded(results.slice(0, action.maxResults || 15), false))
                .startWith(searchTextLoading(true))
                .takeUntil(action$.ofType( TEXT_SEARCH_RESULTS_PURGE, TEXT_SEARCH_RESET, TEXT_SEARCH_ITEM_SELECTED))
                .concat([searchTextLoading(false)])
                .catch(e => {
                    const err = {msgId: "search.generic_error", ...e, message: e.message, stack: e.stack};
                    return Rx.Observable.from([searchResultError(err), searchTextLoading(false)]);
                })
        )

export default {
    SearchPlugin: assign(SearchPlugin, {
        OmniBar: {
            name: 'search',
            position: 1,
            tool: true,
            priority: 1
        }
    }),
    epics: { searchEpic, searchOnStartEpic, searchItemSelected, zoomAndAddPointEpic, textSearchShowGFIEpic },
    reducers: {
        search: searchReducers,
        mapInfo: mapInfoReducers
    }
};
