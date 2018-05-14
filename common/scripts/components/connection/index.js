import React from 'react';
import { Link } from 'react-router'
import _ from 'underscore';
import { translate } from 'react-i18next';

class Connection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentStatus: this.getStatus(this.props.currentMode, this.props.proxy).toUpperCase(),
            modeTooltip: this.generateTooltip()
        };
    }

    componentWillMount() {
        this.cruiseControl = "CR"
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(nextProps.currentMode, this.props.currentMode) || this.props.proxy !== nextProps.proxy ) {
            this.setState(
                {
                    currentStatus: this.getStatus(nextProps.currentMode, nextProps.proxy)
                });
        }
    }

    getStatus(currentMode, proxy) {
        if (currentMode.name === 'External App') {
            return this.props.t('messages:statusConnectedDesktop.message');
        } else if ( (currentMode.name === 'Double Hop' ||
            currentMode.name === 'Cruise Control' ||
            currentMode.name === 'Manual') && proxy) {
            return this.props.t('messages:statusConnected.message');
        } else {
            return this.props.t('messages:statusDisconnected.message');
        };
    }

    generateTooltip() {
        if (this.props.userStatus) return false;

        switch ( this.props.currentMode.name ) {
            case "Cruise Control":
                return this.props.t('messages:connectionModeTooltipCruiseControl.message');
            case "Double Hop":
                return this.props.t('messages:connectionModeTooltipDoubleHop.message');
            case "External App":
                return this.props.t('messages:connectionModeTooltipExternalApp.message');
            case "Manual":
                return this.props.t('messages:connectionModeTooltipManual.message');
            default:
                return this.props.t('messages:connectionModeTooltipDefault.message');
        }
    }

    render() {
        const upgradeTooltip = (
            <span className="upgradeTooltip" data-balloon={this.props.t('messages:upgradeTooltipText.message')}
                  data-balloon-length="medium" data-balloon-pos="down">
            </span>
        );

        let countryImgSrc;
        if (this.props.location.short_name !== this.cruiseControl) {
            countryImgSrc = require(`../../../assets/flags/${this.props.location.country_code.toUpperCase()}.png`);
        }
        const arrowImgSrc = require(`../../../assets/arrow_right.png`);

        return (
            <div className="connection_container">
                <div className="status">{this.state.currentStatus}</div>
                <Link to={this.props.userStatus ? "/" : "/locations"} className="locationChooser">
                    <span className="country_name">
                        <span>{(() => {
                            if(this.props.location.short_name !== this.cruiseControl) {
                                return <img className="country" src={countryImgSrc} />
                                }
                            })()}
                        </span>
                        {this.props.location.name}
                    </span>
                    <span className="arrow-right">
                        <img src={arrowImgSrc} />
                    </span>
                    {this.props.userStatus === 'UPGRADE' && upgradeTooltip }
                </Link>
                <div className="connection_mode">
                    <p className="left currentModeLabel">{this.props.t('messages:connectionModeText.message')}</p>
                    <p className="right"
                       data-balloon={this.generateTooltip.bind(this)()}
                       data-balloon-pos="up"
                       data-balloon-length="medium"
                    >
                        <span>
                            {this.props.t(`messages:connectionModeName${this.props.currentMode.short_name}.message`)}
                        </span>
                    </p>
                </div>
            </div>
        )
    }
}
export default translate(['messages'])(Connection);
