import assign from "object-assign";
import React from "react";
import { connect } from "react-redux";
import { createSelector } from "reselect";
import PropTypes from "prop-types";
import { get } from "lodash";
import Dock from "react-dock";
import ContainerDimensions from "react-container-dimensions";
import Button from "../../components/misc/Button";
import Loader from "../../components/misc/Loader";
import BorderLayout from "../../components/layout/BorderLayout";
import { setControlProperty, toggleControl } from "../../actions/controls";
import { Glyphicon, Row, Col } from "react-bootstrap";
import { createControlEnabledSelector } from "../../selectors/controls";

// Action
import {
    addPoint,
    displaySetting,
    changePointInput,
    clearSearchRouting,
    removePoint,
    swapPoint,
    searchRouting,
    clickGuide,
    clickSearchResult,
    changeRouteMode,
    changeRouteType
} from "./routing/actions/routing";
// Style
import routingStyle from "./routing/routingStyle";

import { routingReducer } from "./routing/reducers/routingReducer";

import {
    clearRoutingResult,
    onSwapRoutingEpic,
    routingChangePointInputEpic,
    routingClickGuideEpic,
    routingResultLoadedEpic,
} from "./routing/epic/routingEpic";

createControlEnabledSelector("routing");
const routingSelector = (state) => get(state, "controls.routing.enabled");

const toggleRoutingTool = toggleControl.bind(null, "routing", null);

const selector = (state) => {
    return {
        pointList: state.routing.pointList,
        displaySetting: state.routing.displaySetting,
        features: state.routing.features,
        routeMode: state.routing.routeMode,
        routeType: state.routing.routeType
    };
};

class RoutingDialog extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        displaySetting: PropTypes.bool,
        dockProps: PropTypes.object,
        loading: PropTypes.bool,
        pointList: PropTypes.array,
        features: PropTypes.array,
        routeMode: PropTypes.string,
        routeType: PropTypes.array,
        onClose: PropTypes.func,
        onSwapPoint: PropTypes.func,
        onAddPoint: PropTypes.func,
        onRemovePoint: PropTypes.func,
        onSearch: PropTypes.func,
        onChangePointInput: PropTypes.func,
        onClickGuide: PropTypes.func,
        onClickSearchResult: PropTypes.func,
        onChangeRouteMode: PropTypes.func
    };

    static defaultProps = {
        show: false,
        displaySetting: false,
        dockProps: {
            dimMode: "none",
            size: 0.3,
            fluid: true,
            position: "right",
            zIndex: 1030,
        },
        loading: false,
        routeMode: null,
        routeType: [],
        pointList: [
            { lat: null, lon: null },
            { lat: null, lon: null },
        ],
        features: []
    };

    onClose = () => {
        this.props.onClose(false);
    };

    onAddPoint = () => {
        this.props.onAddPoint();
    };

    onSwapPoint = () => {
        this.props.onSwapPoint();
    };

    onRemovePoint = (index) => {
        return () => {
            this.props.onRemovePoint(index);
        };
    };

    onDisplaySetting = () => {
        this.props.onDisplaySetting();
    }

    onSearch = () => {
        const pointEmptyValidate = this.props.pointList.find((point) => {
            if (!point.lat || !point.lon) {
                return point;
            }
        });
        const routeMode = this.props.routeMode;
        const routeType = this.props.routeType;
        if (pointEmptyValidate && !pointEmptyValidate.lat) {
            document.getElementById("find-route").innerHTML = "ค้นหาเส้นทาง";
            return;
        } else {
            document.getElementById("find-route").innerHTML = "กำลังค้นหา...";
            this.props.onSearch(this.props.pointList, routeMode,routeType);
        }
    };

    onClearSearch = () => {
        this.props.onClearSearch(this.props);
    };

    onChangePointInput = (index) => {
        return (e) => {
            this.props.onChangePointInput(index, e.nativeEvent.target.value);
        };
    };

    onClickGuide = (value) => {
        return () => {
            this.props.onClickGuide(value);
        };
    };

    onClickSearchResult = (i, j, result) => {
        return () => {
            this.props.onClickSearchResult(i, j, result);
        };
    };

    onChangeRouteMode = (e) => {
        return this.props.onChangeRouteMode(e.target.value);
    }

    onChangeRouteType = (e) => {
        return this.props.onChangeRouteType(e.target.value);
    }

    renderEastimateTime = (time) => {
        var hrs = ~~(time / 3600);
        var mins = ~~((time % 3600) / 60);
        var secs = ~~time % 60;
        var ret = "";
        if (hrs > 0) {
            ret += "" + hrs + " ชั่วโมง " + (mins < 10 ? "0" : "");
        }
        ret += "" + mins + " นาที ";
        return ret;
    };

    renderGuideList = (guideList, time, totalDistance) => {
        return (
            <div>
                <div
                    className="panel panel-primary"
                    style={{ marginTop: "10px" }}
                >
                    <div className="panel-heading">
                        <Row>
                            <Col md={6}>{this.renderEastimateTime(time)}</Col>
                            <Col md={6} style={{ textAlign: "right" }}>
                                ระยะทาง:{" "}
                                {totalDistance > 1000
                                    ? (totalDistance / 1000).toFixed(2) + " กม."
                                    : totalDistance + " เมตร"}
                            </Col>
                        </Row>
                    </div>
                    <div className="panel-body">
                        <div
                            style={routingStyle.routingGuideList}
                            key="routing-guide"
                        >
                            {guideList}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    renderLoading = () => {
        return (
            <div className="loading">
                <Loader size={176} />
            </div>
        );
    };
    renderHeader() {
        return (
            <div style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div>
                        <Button className="square-button no-events">
                            <Glyphicon glyph="record" />
                        </Button>
                    </div>
                    <div
                        style={{
                            flex: "1 1 0%",
                            padding: 8,
                            textAlign: "center",
                        }}
                    >
                        <h4>Routes</h4>
                    </div>
                    <div>
                        <Button
                            className="square-button no-border"
                            onClick={this.onClose}
                        >
                            <Glyphicon glyph="1-close" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const pointList = [];
        for (const [index, value] of this.props.pointList.entries()) {
            const placeholderText = `${index == 0 ? "กำหนดจุดเริ่มต้น" : "เลือกจุดหมาย"
                }`;
            const keyword = value.keyword;
            const results = value.searchResult.data || [];
            const resultList = [];
            for (const [i, result] of results.entries()) {
                resultList.push(
                    <div
                        style={routingStyle.resultStyle}
                        key={`result-${i}-input-${index}`}
                        onClick={this.onClickSearchResult(index, i, result)}
                    >
                        {result.name}
                    </div>
                );
            }
            pointList.push(
                <div style={{ position: "relative" }}>
                    <div key={`point-${index + 1}`} className="input-group">
                        <span
                            className="input-group-addon"
                            style={{ border: "none", background: "none" }}
                        >
                            {index === 0 ? (
                                <Glyphicon glyph="pushpin" />
                            ) : (
                                <Glyphicon glyph="record" />
                            )}
                        </span>
                        <input
                            type="text"
                            key={`point-input-${index + 1}`}
                            value={keyword}
                            className="form-control"
                            style={{ marginTop: "7px" }}
                            onChange={this.onChangePointInput(index)}
                            placeholder={placeholderText}
                        />
                        <div
                            style={
                                index >= 2
                                    ? routingStyle.resultListStyleWithRemove
                                    : routingStyle.resultListStyle
                            }
                        >
                            {resultList}
                        </div>
                        {index >= 2 ? (
                            <span
                                onClick={this.onRemovePoint(index)}
                                className="input-group-addon"
                                id={`btn-rm-${index}`}
                                style={{ border: "none", background: "none" }}
                            >
                                <Glyphicon glyph="remove" />
                            </span>
                        ) : (
                            <span
                                className="input-group-addon"
                                onClick={this.onRemovePoint(index)}
                                id={`btn-rm-${index}`}
                                style={{
                                    display: "none",
                                    border: "none",
                                    background: "none",
                                }}
                            >
                                <Glyphicon glyph="remove" />
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        const guideList = [];
        var eastimateTime = 0.0;
        var totalDistance = 0;
        for (const [index, value] of this.props.features.entries()) {
            if (value.geometry.type !== "LineString") {
                continue;
            }
            eastimateTime += value.properties.interval;
            totalDistance += value.properties.distance;
            const src = `https://api.longdo.com/RouteService/images/turn${value.properties.turn}.png`;
            const d =
                value.properties.distance < 1000
                    ? `${value.properties.distance} m`
                    : `${(value.properties.distance / 1000.0).toFixed(1)} km`;

            guideList.push(
                <div
                    className="routing-guide"
                    style={routingStyle.guideStyle}
                    onClick={this.onClickGuide(value)}
                >
                    <div className="turn" style={routingStyle.turnStyle}>
                        <img style={routingStyle.turnImageStyle} src={src} />
                    </div>
                    <div className="detail">{value.properties.name}</div>
                    <div
                        className="distance"
                        style={routingStyle.distanceStyle}
                    >
                        {d}
                    </div>
                </div>
            );
        }

        return this.props.show ? (
            <ContainerDimensions id="routingContainer">
                {({ width }) => (
                    <span className="react-dock-no-resize">
                        <Dock
                            fluid
                            dockStyle={this.props.dockStyle}
                            {...this.props.dockProps}
                            isVisible={this.props.show}
                            size={330 / width > 1 ? 1 : 330 / width}
                        >
                            <BorderLayout header={this.renderHeader()}>
                                <div
                                    key="routing-body"
                                    role="body"
                                    style={{ padding: "10px" }}
                                >
                                    {pointList}
                                    <br />
                                    {
                                        this.props.displaySetting ? (<div className="route-option" style={{ textAlign: 'center',paddingLeft:'10%',marginBottom: '5%' }}>
                                            <Row>
                                                <Col md={6} style={{ textAlign: 'left' }}>
                                                    <label>โหมดการเดินทาง</label>
                                                    <div onChange={this.onChangeRouteMode}>
                                                        <div className="radio">
                                                            <label><input type="radio" name="routeMode" value="t" />ระยะเวลาน้อยสุด</label>
                                                        </div>
                                                        <div className="radio">
                                                            <label><input type="radio" name="routeMode" value="d" />ระยะทางน้อยสุด</label>
                                                        </div>
                                                        <div className="radio">
                                                            <label><input type="radio" name="routeMode" value="c" />ประหยัดค่าใช้จ่าย</label>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={6} style={{ textAlign: 'left' }}>
                                                    <label>วิธีการเดินทาง</label>
                                                    <div onChange={this.onChangeRouteType}>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" name="routeType" value="1" />ถนนหลัก</label>
                                                        </div>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" value="16" name="routeType" />ทางด่วน</label>
                                                        </div>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" value="32" name="routeType" />รถประจำทาง</label>
                                                        </div>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" value="64" name="routeType" />รถไฟฟ้า</label>
                                                        </div>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" value="4" name="routeType" />รถไฟ</label>
                                                        </div>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" value="8" name="routeType" />เรือ</label>
                                                        </div>
                                                        <div className="checkbox">
                                                            <label><input type="checkbox" value="2" name="routeType" />อากาศ</label>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>) : (<div></div>)
                                    }
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <button
                                                key="add-point"
                                                className="btn btn-londo-circle-sm"
                                                onClick={this.onAddPoint}
                                            >
                                                <Glyphicon glyph="plus" />
                                            </button>
                                            <button
                                                key="swap-point"
                                                className="btn btn-londo-circle-sm"
                                                style={{ marginLeft: "5px" }}
                                                onClick={this.onSwapPoint}
                                            >
                                                <Glyphicon glyph="sort" />
                                            </button>
                                            <button
                                                key="setting"
                                                className="btn btn-londo-circle-sm"
                                                style={{ marginLeft: "5px" }}
                                                onClick={this.onDisplaySetting}
                                            >
                                                <Glyphicon glyph="cog" />
                                            </button>
                                        </div>
                                        <div>
                                            <button
                                                key="clear-routing"
                                                onClick={this.onClearSearch}
                                                className="btn btn-longdo-outline-default btn-rounded"
                                                style={{
                                                    minWidth: "90px",
                                                    marginRight: "5px",
                                                }}
                                            >
                                                ล้าง
                                            </button>
                                            <button
                                                key="search-routing"
                                                onClick={this.onSearch}
                                                className="btn btn-longdo-outline-info btn-rounded"
                                                style={{ minWidth: "100px" }}
                                                id="find-route"
                                            >
                                                ค้นหาเส้นทาง
                                            </button>
                                        </div>
                                    </div>
                                    {guideList.length !== 0 ? (
                                        this.renderGuideList(
                                            guideList,
                                            eastimateTime,
                                            totalDistance
                                        )
                                    ) : (
                                        <div></div>
                                    )}
                                </div>
                            </BorderLayout>
                        </Dock>
                    </span>
                )}
            </ContainerDimensions>
        ) : null;
    }
}

const routing = connect(
    createSelector(
        [
            selector,
            (state) => {
                return routingSelector(state);
            },
        ],
        (routingState, show) => {
            return {
                ...routingState,
                show,
            };
        }
    ),
    {
        onClose: toggleRoutingTool,
        onDisplaySetting: displaySetting,
        onAddPoint: addPoint,
        onSwapPoint: swapPoint,
        onRemovePoint: removePoint,
        onSearch: searchRouting,
        onClearSearch: clearSearchRouting,
        onChangePointInput: changePointInput,
        onClickGuide: clickGuide,
        onClickSearchResult: clickSearchResult,
        onChangeRouteMode: changeRouteMode,
        onChangeRouteType: changeRouteType
    },
    null,
    {
        pure: false,
    }
)(RoutingDialog);

export default {
    RoutingPlugin: assign(routing, {
        BurgerMenu: {
            name: "routing",
            position: 9,
            panel: false,
            help: "help",
            tooltip: "tooltip",
            text: "Routing",
            icon: <Glyphicon glyph="search" />,
            action: () => setControlProperty("routing", "enabled", true),
        },
    }),
    reducers: {
        routing: routingReducer,
    },
    epics: {
        routingResultLoadedEpic,
        routingClickGuideEpic,
        routingChangePointInputEpic,
        onSwapRoutingEpic,
        clearRoutingResult,
    },
};
