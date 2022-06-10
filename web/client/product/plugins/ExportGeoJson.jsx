import { createSelector } from "reselect";
import { createPlugin } from '../../utils/PluginsUtils'
import { connect } from 'react-redux';
import React from 'react';
import { Glyphicon, Tooltip } from 'react-bootstrap';
import Button from '../../components/misc/Button';
import OverlayTrigger from '../../components/misc/OverlayTrigger';


const ExportGeoJson = () => {
    return (<></>);
}

class ExportGeoJsonButton extends React.Component {

    downloadGeoJson = () => {
        let data = {
            type: 'FeatureCollection',
            features: [...this.props.selectedLayers[0].features]
        }
        console.log('mergeFt', data)
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(data)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `${this.props.selectedLayers[0].title}.json`;
        link.click();
    }

    render() {
        return (
            <>
                {/* {this.props.activateTool.activateDownloadTool && status === 'LAYER' && (this.props.selectedLayers[0].name === 'BufferedLayer' || this.props.selectedLayers[0].name === "MergeLayer") && !this.props.settings.expanded && !this.props.layerMetadata.expanded ?
                <OverlayTrigger
                    key="downloadTool"
                    placement="top"
                    overlay={<Tooltip id="toc-tooltip-downloadTool">{this.props.text.downloadToolTooltip}</Tooltip>}>
                    <Button bsStyle={this.props.layerdownload.expanded ? "success" : "primary"} className="square-button-md" onClick={this.downloadGeoJson}>
                        <Glyphicon glyph="download" />
                    </Button>
                </OverlayTrigger>
                : null} */}
                <OverlayTrigger
                    key="downloadTool"
                    placement="top"
                    overlay={<Tooltip id="toc-tooltip-downloadTool">{this.props.text.downloadToolTooltip}</Tooltip>}>
                    <Button className="square-button-md" onClick={this.downloadGeoJson}>
                        <Glyphicon glyph="download" />
                    </Button>
                </OverlayTrigger>
            </>
        )
    }
}

const ExportGeoJsonPlugin = connect(
    createSelector([], () => ({}))
)(ExportGeoJson);

const ConnectedExportGeoJsonButton = connect(
    createSelector([], () => ({}))
)(ExportGeoJsonButton);

export default createPlugin('ExportGeoJson', {
    component: ExportGeoJsonPlugin,
    containers: {
        TOC: {
            doNotHide: true,
            name: "ExportGeoJson", // this works only if AddGroup is one of the plugins internally supported by TOC.
            target: "toolbar",
            selector: ({ status }) => status === 'LAYER',
            Component: ConnectedExportGeoJsonButton
        }
    }
});