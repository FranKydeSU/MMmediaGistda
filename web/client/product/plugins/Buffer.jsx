import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createControlEnabledSelector } from '../../selectors/controls';
import { createSelector } from 'reselect';
import assign from 'object-assign';
import { get } from 'lodash';
import { setControlProperty, toggleControl } from "../../actions/controls";

// import DockablePanel from '../../components/misc/DockablePanel';
import Dialog from '../../components/misc/Dialog';
import { DropdownList } from 'react-widgets';
import Toolbar from '../../components/misc/toolbar/Toolbar';
import { ButtonToolbar, Col, FormGroup, Glyphicon, Grid, Row, Tooltip } from 'react-bootstrap';
import Message from '../../components/I18N/Message';
import BorderLayout from '../../components/layout/BorderLayout'

createControlEnabledSelector("buffer");
const bufferState = (state) => get(state, 'controls.buffer.enabled');

const toggleBufferTool = toggleControl.bind(null, "buffer", null);

const selector = (state) => {
    return {
        show: PropTypes.bool
    };
};

class BufferDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        feature: PropTypes.array,
        onClose: PropTypes.func,
        bufferLengthValue: PropTypes.array,
    }

    static defaultProps = {
        show: false,
        bufferLengthValues: [
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" }
        ]
    };

    onClose = () => {
        this.props.onClose(false)
    }

    render() {
        // console.log(this.props.show)
        return this.props.show ? (
            <Dialog id="measure-dialog" style={this?.dialogStyle} start={this?.start}>
                <div key="header" role="header">
                    <Glyphicon glyph="folder-open" />&nbsp;Buffer
                    <button key="close" onClick={this.onClose} className="close"><Glyphicon glyph="1-close" /></button>
                </div>
                <div key="body" role="body">
                    <p>Layer</p>
                    <DropdownList
                    // disabled={disabled}
                    // value={this?.props?.uom?.length?.label}
                    // onChange={(value) => {
                    //     this.props.onChangeUom("length", value, this?.props?.uom);
                    // }}
                    // data={this?.props?.uomLengthValues}
                    // textField="label"
                    // valueField="value"
                    />
                    <br />
                    <p>Buffer size</p>
                    <DropdownList
                        // disabled={disabled}
                        // value={this?.props?.uom?.length?.label}
                        // onChange={(value) => {
                        //     this.props.onChangeUom("length", value, this?.props?.uom);
                        // }}
                        data={this.props.bufferLengthValues}
                        textField="label"
                        valueField="value"
                    />
                    {/* <BorderLayout
                        id={this.props.id}
                        style={{ overflow: 'visible' }}
                        header={
                            <div>
                                <ButtonToolbar>
                                    <Toolbar
                                        btnDefaultProps={{
                                            className: 'square-button-md',
                                            bsStyle: 'primary'
                                        }}
                                        buttons={
                                            [
                                                {
                                                    glyph: 'remove',
                                                    visible: !!this?.props?.withReset,
                                                    tooltip: <Message msgId="measureComponent.resetTooltip" />,
                                                    onClick: () => this?.onResetClick()
                                                }
                                            ]
                                        } />
                                </ButtonToolbar>
                            </div>
                        }></BorderLayout> */}
                    <br />
                    <button
                        key="buffer-save"
                        onClick={this?.onSearch}
                        className="btn btn-longdo-outline-info"
                        style={{ minWidth: "100px" }}
                        id="find-route"
                    >
                        Save
                    </button>
                    <button
                        key="clear-routing"
                        onClick={this.onClearSearch}
                        className="btn btn-longdo-outline"
                        style={{
                            minWidth: "90px",
                            marginRight: "5px",
                        }}
                    >
                        Cancel
                    </button>

                </div>
            </Dialog>
        ) : null
    }
}

// const mapStateToProps = (state) => ({})

// const mapDispatchToProps = {}

// export default connect(mapStateToProps, mapDispatchToProps)(Buffer)
const buffer = connect(
    createSelector(
        [
            selector,
            (state) => {
                return bufferState(state);
            },
        ],
        (bufferState, show) => {
            return {
                ...bufferState,
                show
            };
        }
    ),
    {
        onClose: toggleBufferTool
        // onDisplaySetting: displaySetting,
        // onAddPoint: addPoint,
        // onSwapPoint: swapPoint,
        // onRemovePoint: removePoint,
        // onSearch: searchRouting,
        // onClearSearch: clearSearchRouting,
        // onChangePointInput: changePointInput,
        // onClickGuide: clickGuide,
        // onClickSearchResult: clickSearchResult,
        // onChangeRouteMode: changeRouteMode,
        // onChangeRouteType: changeRouteType
    },
    null,
    {
        pure: false,
    }
)(BufferDialog);

export default {
    BufferPlugin: assign(buffer, {
        BurgerMenu: {
            name: "buffer",
            position: 9,
            panel: false,
            help: "help",
            tooltip: "tooltip",
            text: "Buffer",
            icon: <Glyphicon glyph="search" />,
            action: () => setControlProperty("buffer", "enabled", true),
        },
    }),
    reducers: {
    },
    epics: {
    },
};