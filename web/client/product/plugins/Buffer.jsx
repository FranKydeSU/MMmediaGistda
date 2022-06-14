import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { createControlEnabledSelector } from "../../selectors/controls";
import { createSelector } from "reselect";
import assign from "object-assign";
import { get } from "lodash";
import { setControlProperty } from "../../actions/controls";

// Actions
import {
    setLayer,
    setRadius,
    setUnit,
    doBuffer,
    toggleBufferTool,
} from './buffer/actions/buffer'

// Epics
import {
    doBufferEpic,
    addAsBufferedLayerEpic
} from './buffer/epics/bufferEpic'

// Reducer
import {
    bufferReducer
} from './buffer/reducers/bufferReducer'

import Dialog from "../../components/misc/Dialog";
import { DropdownList } from "react-widgets";
import { Col, Glyphicon, Row } from "react-bootstrap";
import { groupsSelector } from "../../selectors/layers";
import LayerSelector from "./buffer/LayerSelector";
import Message from "../../components/I18N/Message";

createControlEnabledSelector("buffer");

const bufferSelector = (state) => get(state, "controls.buffer.enabled");

const layerNodesExtracter = (groups) => {
    const layerNode = [];
    groups.map((groupNode) => {
        layerNode.push(...groupNode.nodes);
    });
    return layerNode;
};

// -------------------------------------Selector--------------------------------------
const selector = (state) => {
    return {
        layerIndex: state.buffer.layerIndex,
        unitValue: state.buffer.unitValue,
        radius: state.buffer.radius,
        featuresSelected: state.buffer.featuresSelected,
        bufferedFeatures: state.buffer.bufferedFeatures,
        loading: state.buffer.loading,
        error: state.buffer.error,
    };
};

class BufferDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        radius: PropTypes.number,
        bufferLengthValue: PropTypes.array,
        layersNode: PropTypes.array,
        layersGroups: PropTypes.array,
        layerIndex: PropTypes.number,
        unitValue: PropTypes.string,
        loading: PropTypes.bool,
        error: PropTypes.string,

        onClose: PropTypes.func,
        onChangeLayer: PropTypes.func,
        onChangeUnit: PropTypes.func,
        onDoBuffer: PropTypes.func,
    };

    static defaultProps = {
        show: false,
        bufferUnitValues: [
            { value: "kilometers", label: "km" },
            { value: "meters", label: "m" },
            { value: "วา", label: "วา" },
            { value: "miles", label: "miles" },
            { value: "degrees", label: "degrees" },
        ],
        radius: 1,
        layersNode: [],
        layersGroups: [],
        layerIndex: -1,
        unitValue: "",
        error: '',

        onClose: () => { },
        onChangeLayer: () => { },
        onChangeUnit: () => { },
        onDoBuffer: () => { },
    };

    dialogStyle = {
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '500px',
    };

    start = {
        x: (window.innerWidth - 600) * 0.5,
        y: (window.innerHeight - 100) * 0.5
    }

    onClose = () => {
        this.props.onClose(false);
    };

    onLayerChange = (idx) => {
        this.props.onChangeLayer(idx);
    };

    onDoBuffer = () => {
        this.props.onDoBuffer(this.props.layersNode[this.props.layerIndex]);
    };

    onChangeUnit = (unit) => {
        this.props.onChangeUnit(unit);
    };

    onChangeRadius = (radius) => {
        if (radius <= 0)
            radius = 0;
        this.props.onChangeRadius(Number(radius));
    };

    onReset = () => {
        this.props.onChangeLayer(-1);
    };

    render() {
        return this.props.show ? (
            <Dialog
                Dialog
                id="measure-dialog"
                style={this?.dialogStyle}
                start={this?.start}
            >
                <div key="header" role="header">
                    <Glyphicon glyph="folder-open" />
                    &nbsp;
                    <Message msgId="bufferPlugin.title" />
                    <button
                        key="close"
                        onClick={this.onClose}
                        className="close"
                    >
                        <Glyphicon glyph="1-close" />
                    </button>
                </div>
                <div key="body" role="body">
                    <p>
                        <Message msgId="bufferPlugin.layerLabel" />
                    </p>
                    <LayerSelector
                        responses={this.props.layersNode}
                        index={this.props.layerIndex}
                        setIndex={this.onLayerChange}
                    ></LayerSelector>
                    <br />
                    <p>
                        <Message msgId="bufferPlugin.bufferLabel" />
                    </p>
                    <Row>
                        <Col md={6} sm={6}>
                            <input
                                style={{
                                    height: "34px"
                                }}
                                required
                                type="text"
                                onkeypress="return (event.charCode !=8 && event.charCode ==0 || ( event.charCode == 46 || (event.charCode >= 48 && event.charCode <= 57)))"
                                className="form-control"
                                id="buffer-size"
                                onChange={(e) => this.onChangeRadius(e.nativeEvent.target.value)}
                                value={this.props.radius >= 0 ? this.props.radius : ""}
                            />
                        </Col>
                        <Col md={6} sm={6}>
                            <DropdownList
                                id="bufferUnitValues"
                                data={this.props.bufferUnitValues}
                                dataKey="value"
                                textField="label"
                                valueField="value"
                                defaultValue={this.props.bufferUnitValues[0]}
                                onChange={(unit) => this.onChangeUnit(unit.value)}
                            />
                        </Col>
                    </Row>
                    <br />
                    <div
                        style={{
                            display: "flex",
                        }}
                    >
                        <br />
                        {this.props.loading ? (
                            <button
                                key="buffer-save"
                                className="btn btn-longdo-outline-info"
                                style={{ minWidth: "100px" }}
                                disabled
                            >
                                <Message msgId="bufferPlugin.loading" />
                            </button>
                        ) : (
                            <button
                                key="buffer-save"
                                className="btn btn-longdo-outline-info"
                                style={{ minWidth: "100px" }}
                                onClick={this.onDoBuffer}
                            >
                                <Message msgId="bufferPlugin.button" />
                            </button>
                        )}

                        <button
                            key="clear-routing"
                            onClick={this.onReset}
                            className="btn btn-longdo-outline"
                            style={{
                                minWidth: "90px",
                                marginRight: "5px",
                            }}
                        >
                            <Message msgId="bufferPlugin.resetButton" />
                        </button>
                    </div>
                    <br />
                    {this.props.error === "succeed" ? (
                        <span style={{ color: "green" }}><Message msgId="bufferPlugin.successText" /></span>
                    ) : (
                        <span style={{ color: "red" }}>{this.props.error}</span>
                    )}
                </div>
            </Dialog>
        ) : null;
    }
}

const buffer = connect(
    createSelector(
        [
            selector,
            (state) => {
                return bufferSelector(state);
            },
            groupsSelector,
        ],
        (bufferState, show, layersGroups) => {
            return {
                ...bufferState,
                show,
                layersGroups,
                layersNode: layerNodesExtracter(layersGroups),
            };
        }
    ),
    {
        onClose: toggleBufferTool,
        onChangeLayer: setLayer,
        onChangeUnit: setUnit,
        onChangeRadius: setRadius,
        onDoBuffer: doBuffer,
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
            position: 10,
            panel: false,
            help: "help",
            tooltip: "tooltip",
            text: "Buffer",
            icon: <Glyphicon glyph="resize-full" />,
            action: () => setControlProperty("buffer", "enabled", true),
        },
    }),
    reducers: {
        buffer: bufferReducer,
    },
    epics: {
        doBufferEpic,
        addAsBufferedLayerEpic,
    },
};
