import React from 'react'
import PropTypes from 'prop-types';
import {Link} from 'react-router'
import { translate } from 'react-i18next';
import { showRateUsPopup } from '../helpers';

class ServiceScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            errorHeader: '',
            errorText: '',
            errorSpinner: false,
            rateUsPopup: false
        }
    }

    componentDidMount() {
        this.props.data.current.isOtherExtensionPresent && this.setState({
            errorHeader: this.props.t('messages:errOtherExtensionHeader.message'),
            errorText: this.props.t('messages:errOtherExtensionText.message'),
            errorSpinner: true
        });

        this.props.data.current.isOtherExtensionPresent && chrome.runtime.sendMessage({action: 'RESTART_APP'});

        const showRateUs = showRateUsPopup(this.props.data);
        showRateUs && this.setState({
            rateUsPopup: true
        });
        this.setState({
            rateUsPopup: true
        })
    }

    rateUsHandler() {
        chrome.tabs.create({url: this.props.data.webStoreUrl});
        chrome.runtime.sendMessage({action: 'SET_RATEUS_SHOWN', data: true});
    }

    denyRating() {
        chrome.runtime.sendMessage({action: 'SET_RATEUS_SHOWN', data: true}, () => {
            this.context.router.push('/');
        });
    }

    render() {
        const { t } = this.props;
        const rateImgSrc = require(`../../../assets/extension_icons/128x128_on.png`);
        const updateImgSrc = require(`../../../assets/Update_blue_icon2x.png`);

        const errorSpinner = (
            <div className="error-spinner">
                <div className="cp-spinner cp-round"></div>
            </div>
        );
        const rateUsHeader = (
            <div>
                <img src={rateImgSrc} />
                <div className="ratePopupHeader ratePopupWSColor">{t('messages:rateUsHeader.message')}</div>
                <div className="ratePopupDefaultColor">{t('messages:rateUsHeaderText.message')}</div>
            </div>
        );

        const errImage = (
            <div className="error-image">
                <img src={updateImgSrc} />
            </div>
        );

        const rateUsText = (
            <div style={{
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Link
                    to="/home"
                    onClick={this.rateUsHandler.bind(this)}
                    style={{
                        fontSize: '27px'
                    }}
                    className="ratePopupWSColor"
                >
                    {t('messages:rateUsCTA.message')}
                </Link>
                <Link
                    to="/home"
                    onClick={this.denyRating.bind(this)}
                    className="ratePopupDefaultColor"
                >
                    {t('messages:rateUsNo.message')}
                </Link>
            </div>
        );

        return (
            <div className={"disablingDiv " + (this.state.rateUsPopup ? 'rateUsTop' : '') }>
                { this.state.errorHeader && errImage }
                <div className="error-header">
                    { this.state.errorHeader }
                    { !this.state.errorHeader && this.state.rateUsPopup && rateUsHeader }
                </div>
                <div className="error">
                    { this.state.errorText }
                    { !this.state.errorHeader && this.state.rateUsPopup && rateUsText }
                </div>
                { this.state.errorSpinner && errorSpinner }
            </div>
        )
    }
}

ServiceScreen.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(ServiceScreen);
