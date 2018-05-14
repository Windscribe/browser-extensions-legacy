import React from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import _ from 'underscore'

import events from './events';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.props = props;
        this.state = {
            userInfo: {},
            listsStates: {},
            lists: {},
            recentLinks: ''
        };
    }

    componentWillMount() {
        const fromContextMenu = /securelinkdialog/.test(window.location.href);
        let self = this;

        function backgroundListener(response, sender, sendResponse) {
            // console.log('listening to', response.type || response.action);
            if (events.hasOwnProperty(response.type)) {
                events[response.type](response, self);
            }
            return;
        }

        !chrome.runtime.onMessage.hasListener(backgroundListener) && chrome.runtime.onMessage.addListener(backgroundListener);

        chrome.runtime.sendMessage({action: 'GET_POPUP_STATE', fromContextMenu});
    }

    render() {
        const app = React.cloneElement(this.props.children,
            {
                data: this.state.userInfo,
                listsStates: this.state.listsStates,
                lists: this.state.lists,
                recentLinks: this.state.recentLinks
            });

        return (
            <div className="transparent">
                { !_.isEmpty(this.state.userInfo) && !_.isEmpty(this.state.listsStates) && !_.isEmpty(this.state.lists) && app }
            </div>
        )
    }
}

App.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(App);
