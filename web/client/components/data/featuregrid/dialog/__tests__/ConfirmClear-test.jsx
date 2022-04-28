/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';

import ConfirmClear from '../ConfirmClear';

describe('Test for ConfirmClear component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"><div class="ms2"><div id="modal-new-container"></div></div><div id="modal-container"></div></div>';
        document.body.className = "";
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('test portal of dialog', () => {
        ReactDOM.render(<ConfirmClear />, document.getElementById("modal-container"));
        const modalInitialContainer = document.getElementById("modal-container");
        const modalNewContainer = document.getElementById("modal-new-container");
        const DIALOG_QUERY_SELECTOR = '.modal-dialog';
        expect(modalInitialContainer.querySelector(DIALOG_QUERY_SELECTOR)).toBe(null);
        expect(modalNewContainer.querySelector(DIALOG_QUERY_SELECTOR)).toExist();
    });
});

