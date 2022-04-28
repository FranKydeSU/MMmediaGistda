/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {createSink} from 'recompose';
import expect from 'expect';
import wfsChart from '../wfsChart';

describe('wfsChart enhancer', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('wfsChart data retrival', (done) => {
        const Sink = wfsChart(createSink( ({data, loading} = {}) => {
            if (!loading) {
                expect(data).toExist();
                expect(data.length).toBe(18);
                data.map(({ STATE_NAME, LAND_KM}) => {
                    expect(STATE_NAME).toBeTruthy();
                    expect(LAND_KM).toBeTruthy();
                });
                done();
            }
        }));
        const props = {
            layer: {
                name: "test",
                url: 'base/web/client/test-resources/wfs/Arizona_18_results.json',
                wpsUrl: 'base/web/client/test-resources/wfs/Arizona_18_results.json',
                search: { url: 'base/web/client/test-resources/wfs/Arizona_18_results.json'}},
            options: {
                aggregationAttribute: "LAND_KM",
                groupByAttributes: "STATE_NAME"
            }
        };
        ReactDOM.render(<Sink {...props} />, document.getElementById("container"));
    });
    it('wfsChart error management', (done) => {
        const Sink = wfsChart(createSink( ({error, loading} = {}) => {
            if (!loading && error) {
                expect(error).toExist();
                done();
            }
        }));
        const props = {
            layer: {
                name: "test",
                url: 'base/web/client/test-resources/widgetbuilder/aggregate',
                wpsUrl: 'base/web/client/test-resources/widgetbuilder/no-data',
                search: {url: 'base/web/client/test-resources/widgetbuilder/aggregate'}},
            options: {
                aggregateFunction: "Count",
                aggregationAttribute: "test",
                groupByAttributes: "test"
            }
        };
        ReactDOM.render(<Sink {...props} />, document.getElementById("container"));
    });
});
