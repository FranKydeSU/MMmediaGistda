import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

/**
 * Header for MapViewer.
 * @name MapHeader
 * @class
 * @memberof plugins
 */

class MapHeaderComp extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        style: PropTypes.object,
        id: PropTypes.string,
        title: PropTypes.string
    };

    static defaultProps = {
        className: "mapstore-map-header",
        style: {},
        id: "mapstore-map-header",
        title: ""
    };

    render() {
        return (
            <div id={this.props.id}
                style={this.props.style}
                className={this.props.className}
                stateSelector="mapHeader">
                <span className="title">{this.props.title}</span>
            </div>
        );
    }
}

const MapHeader = connect(
    (state) => ({
        title: state.map && state.map.present && state.map.present.info && state.map.present.info.name || ''
    }), {})(MapHeaderComp);

export default {
    MapHeaderPlugin: MapHeader,
    reducers: {}
};