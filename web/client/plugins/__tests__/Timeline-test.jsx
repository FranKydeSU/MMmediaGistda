/**
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';

import TimelinePlugin from '../Timeline';
import { getPluginForTest } from './pluginsTestUtils';


import MapUtils from '../../utils/MapUtils';

const SAMPLE_STATE = {
    timeline: {
        selectedLayer: "TEST_LAYER",
        range: {
            start: "2000-01-01T00:00:00.000Z",
            end: "2020-12-31T00:00:00.000Z"
        }
    },
    layers: {
        flat: [{
            id: 'TEST_LAYER',
            name: 'TEST_LAYER',
            type: 'wms',
            url: 'base/web/client/test-resources/wmts/DomainValues.xml',
            dimensions: [
                {
                    source: {
                        type: 'multidim-extension',
                        // this forces to load fixed values from the test file, ignoring parameters
                        url: 'base/web/client/test-resources/wmts/DomainValues.xml'
                    },
                    name: 'time'
                }
            ],
            params: {
                time: '2000-06-08T00:00:00.000Z'
            },
            visibility: true
        }]
    }
};

const FALSY_STATE = {
    timeline: {
        selectedLayer: "TEST_LAYER",
        range: {
            start: "2000-01-01T00:00:00.000Z",
            end: "2020-12-31T00:00:00.000Z"
        }
    },
    layers: {
        flat: [{
            id: 'TEST_LAYER',
            name: 'TEST_LAYER',
            type: 'wms',
            url: 'base/web/client/test-resources/wmts/DomainValues.xml',
            dimensions: [
                {
                    source: {
                        type: 'multidim-extension',
                        // this forces to load fixed values from the test file, ignoring parameters
                        url: 'base/web/client/test-resources/wmts/DomainValues.xml'
                    },
                    name: 'time'
                }
            ],
            params: {
                time: '2000-06-08T00:00:00.000Z'
            },
            visibility: false
        }, {
            id: 'TEST_LAYER_2',
            name: 'TEST_LAYER_2',
            type: 'wms',
            url: 'base/web/client/test-resources/wmts/DomainValues.xml',
            dimensions: [
                {
                    source: {
                        type: 'multidim-extension',
                        // this forces to load fixed values from the test file, ignoring parameters
                        url: 'base/web/client/test-resources/wmts/DomainValues.xml'
                    },
                    name: 'time'
                }
            ],
            params: {
                time: '2000-06-08T00:00:00.000Z'
            },
            visibility: false
        }]
    }
};

describe('Timeline Plugin', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
        MapUtils.clearHooks();
    });


    describe('render Plugin', () => {
        it('do not render when state missing', () => {
            const { Plugin } = getPluginForTest(TimelinePlugin, {});
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('.timeline-plugin')).toBeFalsy();
        });
        it('render with minimal state with default config', () => {
            const { Plugin} = getPluginForTest(TimelinePlugin, SAMPLE_STATE);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('.timeline-plugin')).toBeTruthy();
        });
        it('render with minimal state with config', () => {
            const _state = {...SAMPLE_STATE, timeline: {...SAMPLE_STATE.timeline, setting: {showHiddenLayers: true}}};
            const { Plugin} = getPluginForTest(TimelinePlugin, _state);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('.timeline-plugin')).toBeTruthy();
        });
        it('Timeline plugin is not visible when all layers with dimension data have visibility set to false', ()=>{
            const { Plugin } = getPluginForTest(TimelinePlugin, FALSY_STATE);
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('.timeline-plugin.hidden')).toBeTruthy();
        });
        it('Timeline plugin is not visible when there are no layers with dimension data', ()=>{
            const { Plugin } = getPluginForTest(TimelinePlugin, {});
            ReactDOM.render(<Plugin />, document.getElementById("container"));
            expect(document.querySelector('.timeline-plugin')).toBeFalsy();
        });
    });
});
