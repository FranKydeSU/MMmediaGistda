/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import ShareSocials from '../ShareSocials';
import ReactTestUtils from 'react-dom/test-utils';

describe("The ShareSocials component", () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('is created with defaults', () => {
        const cmpShareSocials = ReactDOM.render(<ShareSocials getCount={()=>0} shareUrl="www.geo-solutions.it"/>, document.getElementById("container"));
        expect(cmpShareSocials).toExist();
    });

    it('should have the facebook circle', () => {
        const cmpShareSocials = ReactDOM.render(<ShareSocials getCount={()=>0} shareUrl="www.geo-solutions.it"/>, document.getElementById("container"));
        expect(cmpShareSocials).toExist();

        const socialBox = ReactDOM.findDOMNode(ReactTestUtils.scryRenderedDOMComponentsWithTag(cmpShareSocials, "circle")[0]);
        expect(socialBox).toExist();

    });

});
