/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Col, Row, Panel, Label, Alert } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import { DropdownList } from 'react-widgets';

import Button from '../../misc/Button';
import { Message } from '../../I18N/I18N';
import { getbsStyleForState } from '../../../utils/ImporterUtils';
import Layer from './Layer';
import TransformsGrid from './TransformsGrid';

class Task extends React.Component {
    static propTypes = {
        task: PropTypes.object,
        panStyle: PropTypes.object,
        updateTask: PropTypes.func,
        deleteTask: PropTypes.func,
        loadLayer: PropTypes.func,
        updateLayer: PropTypes.func,
        loadTransform: PropTypes.func,
        deleteTransform: PropTypes.func
    };

    static defaultProps = {
        task: {},
        panStyle: {
            minHeight: "250px"
        },
        updateTask: () => {},
        deleteTask: () => {},
        loadLayer: () => {},
        updateLayer: () => {},
        loadTransform: () => {},
        deleteTransform: () => {}

    };

    renderLoading = (element) => {
        if (this.props.task.loading ) {
            if (!element) {
                return <Spinner spinnerName="circle" overrideSpinnerClassName="spinner"/>;
            } else if (this.props.task.element === element) {
                return <Spinner spinnerName="circle" overrideSpinnerClassName="spinner"/>;
            }
        }
        return null;
    };

    renderErrorMessage = (task) => {
        if (task.errorMessage && task.state === "ERROR") {
            return (
                <Alert bsStyle="danger" style={{
                    maxHeight: "80px",
                    overflow: "auto"
                }}>{task.errorMessage}</Alert>);
        }
        return null;

    };

    renderGeneral = (task) => {
        let modes = this.props.task.transformChain && this.props.task.transformChain.type === "vector" ? ["CREATE"] : ["CREATE", "REPLACE"];
        return (<Panel style={this.props.panStyle} bsStyle="info" header={<span><Message msgId="importer.task.general" /></span>}>
            <dl className="dl-horizontal">
                <dt><Message msgId="importer.task.status" /></dt>
                <dd><Label bsStyle={getbsStyleForState(task.state)}>{task.state}</Label>{this.renderErrorMessage(task)}</dd>
                <dt><Message msgId="importer.task.updateMode" /></dt>
                <dd>{
                    this.props.task.state === "READY" // force this to default because APPEND and REPLACE are not supported yet.
                    /* this.props.task */? <DropdownList data={modes} value={task.updateMode} onChange={this.updateMode}/> :
                        task.updateMode}</dd>
            </dl>
        </Panel>);
    };

    renderDataPanel = (data) => {
        return (<Panel style={this.props.panStyle} bsStyle="info" header={<span><Message msgId="importer.task.originalData" /></span>}>
            <dl className="dl-horizontal">
                <dt><Message msgId="importer.task.file" /></dt>
                <dd>{data.file}</dd>
                <dt><Message msgId="importer.task.format" /></dt>
                <dd>{data.format}</dd>
            </dl>
        </Panel>);
    };

    renderTargetPanel = (target) => {
        if (!target) {
            return null;
        }
        return (<Panel style={this.props.panStyle} bsStyle="info" header={<span><Message msgId="importer.task.targetStore" />{this.renderLoading("target")}</span>}>
            <dl className="dl-horizontal">
                <dt><Message msgId="importer.task.storeType" /></dt>
                <dd>{target.dataStore && target.dataStore.type || target.coverageStore && target.coverageStore.type}</dd>
                <dt><Message msgId="importer.task.storeName" /></dt>
                <dd>{target.dataStore && target.dataStore.name || target.coverageStore && target.coverageStore.name}</dd>
            </dl>
        </Panel>);
    };

    render() {
        return (
            <Panel header={<Message msgId="importer.task.panelTitle" msgParams={{id: this.props.task.id}} />} >
                <Grid fluid>
                    <Row>
                        <Col lg={4} md={6} xs={12}>
                            {this.renderGeneral(this.props.task)}
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                            {this.renderDataPanel(this.props.task.data)}
                        </Col>
                        <Col lg={4} md={6} xs={12}>
                            {this.renderTargetPanel(this.props.task.target)}
                        </Col>
                        <Col lg={6} md={6} xs={12}>
                            <Layer
                                edit={this.props.task.state === "READY"}
                                panProps={{
                                    bsStyle: "info",
                                    header: <span><Message msgId="importer.task.layer" />{this.renderLoading("layer")}</span>,
                                    style: this.props.panStyle
                                }}
                                layer={this.props.task.layer}
                                updateLayer={this.props.updateLayer}/>
                        </Col>
                        <Col lg={6} md={12} xs={12}>
                            <TransformsGrid
                                panProps={{bsStyle: "info", style: this.props.panStyle }}
                                transforms={this.props.task.transformChain && this.props.task.transformChain.transforms}
                                loadTransform={this.props.loadTransform}
                                deleteTransform={this.props.deleteTransform}
                                type={this.props.task.transformChain && this.props.task.transformChain.type}
                            />
                        </Col>
                    </Row>
                    <Row style={{"float": "right"}}>
                        <Button bsStyle="danger" onClick={() => {this.props.deleteTask(this.props.task.id); }}><Message msgId="importer.task.delete" /></Button>
                    </Row>
                </Grid>
            </Panel>
        );
    }

    updateMode = (value) => {
        this.props.updateTask({
            "updateMode": value
        });
    };
}

export default Task;
