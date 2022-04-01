export default {
    start : {
        x: (window.innerWidth - 600) * 0.5,
        y: (window.innerHeight - 500) * 0.5,
    },
    dialogStyle : {
        position: "fixed",
        top: "0px",
        left: "0px",
    },
    routingGuideList : {
        marginTop: "10px",
        paddingRight: "10px",
        overflow: "auto",
    },
    guideStyle : {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        cursor: "pointer",
    },
    turnStyle : {
        width: "36px",
        height: "36px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "stretch",
        padding: "12px 0px",
    },
    turnImageStyle : {
        width: "16px",
        height: "16px",
    },
    distanceStyle : {
        marginLeft: "auto",
    },
    resultListStyle : {
        borderLeft: "1px solid #dddddd",
        borderRight: "1px solid #dddddd",
        position: "absolute",
        background: "white",
        maxHeight: "600px",
        overflowY: "auto",
        width: "90.5%",
        zIndex: 20,
        marginTop: "11.5%",
    },
    resultListStyleWithRemove : {
        borderLeft: "1px solid #dddddd",
        borderRight: "1px solid #dddddd",
        position: "absolute",
        background: "white",
        maxHeight: "600px",
        overflowY: "auto",
        width: "80.5%",
        marginTop: "12.1%",
        zIndex: 20,
    },
    resultStyle : {
        padding: "6px 12px",
        cursor: "pointer",
    }
}