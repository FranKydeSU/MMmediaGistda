

import React from 'react';
import assign from 'object-assign';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { createControlEnabledSelector } from '../../selectors/controls';
import { setControlProperty } from "../../actions/controls";
import { Glyphicon } from 'react-bootstrap';
import { createSelector } from 'reselect';
// Components
import Dialog from '../../components/misc/Dialog';

createControlEnabledSelector('prtsc');
const printScreenState = (state) => get(state, 'controls.prtsc.enabled');

export const TOGGLE_CONTROL = 'TOGGLE_CONTROL';

const toggleNearbyTool = () => {
    return {
        type: TOGGLE_CONTROL,
        control: 'prtsc',
        property: null
    };
}

const defaultState = {
    zoom: 1.0,
};
const selector = (state) => {
    return {
        show: PropTypes.bool,
        zoom: state.prtsc.zoom,
    };
};

function printScreenReducer(state = defaultState, action) {
    switch (action.type) {
        default: {
            return state;
        }
    }
}

class PrintScreenComponent extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        zoom: PropTypes.number,
        onClose: PropTypes.func,
    };

    static defaultProps = {
        show: false
    };


    dialogStyle = {
        position: 'fixed',
        top: '0px',
        left: '0px'
    };
    start = {
        x: (window.innerWidth - 600) * 0.5,
        y: (window.innerHeight - 100) * 0.5
    }

    onClose = () => {
        this.props.onClose(false);
    };


    render() {
        return this.props.show ? (
            <Dialog id="nearby-dialog" style={this.dialogStyle} start={this.start}>
            <div key="header" role="header">
                <Glyphicon glyph="search"/>&nbsp;Print Screen
                <button key="close" onClick={this.onClose} className="close"><Glyphicon glyph="1-close" /></button>
            </div>
            <div key="body" role="body">
                {/* <center>
                    <button className='btn btn-info'>Capture</button>
                </center> */}
            </div>
        </Dialog>
        ) : null
    }
}

const prtsc = connect(
    createSelector(
        [
            selector,
            (state) => {
                return printScreenState(state);
            },
        ],
        (prtscState, show) => {
            return {
                ...prtscState,
                show
            };
        }
    ),
    {
        onClose: toggleNearbyTool,
    },
    null,
    { pure: false, }
)(PrintScreenComponent);

export default {
    PrintScreenPlugin: assign(prtsc, {
        BurgerMenu: {
            name: 'prtsc',
            position: 3,
            panel: false,
            help: 'help',
            tooltip: 'tooltip',
            text: 'PrintScreen',
            icon: <Glyphicon glyph="record" />,
            action: () => setControlProperty('prtsc', 'enabled', true)
        }
    }),
    reducers: {
        prtsc: printScreenReducer
    },
    epics: {},
};