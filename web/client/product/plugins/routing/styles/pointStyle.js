import uuidv1 from "uuid/v1";
export const routePointStyle = function (type) {
    switch (type) {
        case "START":
            return {
                iconGlyph: "map-marker",
                iconShape: "square",
                iconColor: "blue",
                highlight: false,
                id: uuidv1(),
            };
        case "END":
            return {
                iconGlyph: "stop-circle",
                iconShape: "square",
                iconColor: "blue",
                highlight: false,
                id: uuidv1(),
            };
        default:
            return {
                iconGlyph: "map-marker",
                iconShape: "square",
                iconColor: "blue",
                highlight: false,
                id: uuidv1(),
            };
    }
};