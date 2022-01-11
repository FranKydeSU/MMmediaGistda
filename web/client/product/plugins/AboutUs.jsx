import React from 'react';
import PropTypes from 'prop-types';
import assign from 'object-assign';


class AboutUs extends React.Component {
    static propTypes = {
        src: PropTypes.string,
        style: PropTypes.object
    };

    static defaultProps = {
        src: '',
        style: {
            position: "absolute",
            width: "124px",
            left: 0,
            bottom: 0
        }
    };

    render() {
        return (<div>
            Hi
        </div>);
    }

}
export default {
    AboutUsPlugin: assign(AboutUs, {
        NavMenu: {
            position: 3,
            label: 'Longdo Map',
            linkId: '#ok-tap',
            glyph: 'dashboard'
        }
    }),
    epics: {
    },
    reducers: {
    }
};

