import React from 'react'
import PropTypes from 'prop-types';
import TopNavigation from './topNavigation.js'
import Content from './content.js'
import _ from 'underscore';
import { showRateUsPopup } from './helpers';

const CHANGE_APP_IS_ON = "CHANGE_APP_IS_ON";

class Home extends React.Component {
    _bind(...methods) {
        _.each(methods, (method) => this[method] = this[method].bind(this));
    }

    constructor(props) {
        super(props);
        this._bind('checkStatus');
    }

    componentDidMount() {
        /securelinkdialog/.test(window.location.href) && this.context.router.push({
            pathname: '/secure_link',
            state: { fromContextMenu: true }
        });

        const showRateUs = showRateUsPopup(this.props.data);

        ( this.props.data.current.isOtherExtensionPresent || showRateUs ) && this.context.router.push('/service');
    }

    checkStatus(sessionData) {
        if (!sessionData) return;
        if (sessionData.is_premium > 0) return "PREMIUM";
        if ( this.props.data.current.userStatus ) return this.props.data.current.userStatus;

        const traffic = ( (sessionData.traffic_max - sessionData.traffic_used) / Math.pow(2, 30) ).toFixed(2);
        return traffic;
    }

    render() {
        // console.log('this-lists', this.props.lists)
        return (
            <div className={ this.props.data.current.appIsOn ? "enabled" : "disabled"}>
                <TopNavigation
                    router={this.context.router}
                    traffic={this.checkStatus(this.props.data.session.data)}
                    history={this.context.router}
                    rootUrl={this.props.data.rootUrl}
                    sessionAuthHash={this.props.data.session_auth_hash}
                    premiumExpiryDate={this.props.data.current.premiumExpiryDate}
                    rebill={this.props.data.current.rebill}
                    newInstall={this.props.listsStates.newInstall}
                    notificationsList={this.props.lists.notificationsList}
                    notificationsShown={this.props.lists.notificationsShown}
                />
                <Content data={this.props.data}
                         listsStates={this.props.listsStates}
                         lists={ this.props.lists }
                         router={this.context.router}
                />
            </div>
        )
    }
}

Home.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Home;
