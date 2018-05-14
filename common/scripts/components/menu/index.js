import React from 'react'
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';

const Menu = (props, context) => {
    chrome.runtime.sendMessage({action: 'RECENT_LINKS'});

    function navigateTo(e, destination) {
        e.preventDefault();
        context.router.push(destination);
    }

    function goHelp(e) {
        e.preventDefault();
        chrome.tabs.create({url: props.data.rootUrl + "help"});
    }

    function goMyAccount(e) {
        e.preventDefault();
        chrome.tabs.create({url: props.data.rootUrl + "myaccount?ext_session=" + props.data.session_auth_hash});
    }

    function goUpgrade(e) {
        e.preventDefault();
        chrome.tabs.create({url: props.data.rootUrl + "upgrade?ext_session="+ props.data.session_auth_hash});
    }

    function logOut(e) {
        e.preventDefault();
        chrome.runtime.sendMessage({action: 'LOGOUT'});
        context.router.push({
            pathname: '/',
            query: {
                loggingout: true
            }
        });
    }

    const { t } = props;
    const arrowLeftImgSrc = require(`../../../assets/arrow_left.png`);
    const arrowRightImgSrc = require(`../../../assets/arrow_right.png`);

    const upgradeDiv = (
        <div className="item">
            <a id="upgrade" onClick={goUpgrade}><span>{t('messages:menuUpgrade.message')}</span></a>
        </div>
    )

    return (
        <div className={ props.data.current.appIsOn ? "main-menu enabled" : "main-menu disabled"}>
            <div className="topNav">
                <div className="top topSecondary">
                    <a id="mainScreenLink" onClick={(e) => navigateTo(e, '/')}> <img src={arrowLeftImgSrc}/><span>{t('messages:backTitle.message')}</span></a>
                    <span >{t('messages:menuTitle.message')}</span>
                </div>
            </div>
            <div id="menu">

                <div className="item firstItem" id="resentLinks" onClick={(e) => navigateTo(e, '/recent-links')}>
                    <a>
                        <span>
                            {t('messages:menuRecentSLinks.message')}
                        </span>
                        <span className="arrow-right">
                            <img src={arrowRightImgSrc}/>
                        </span>
                    </a>
                </div>

                <div className="item" id="privacyOptions" onClick={(e) => navigateTo(e, '/blocking-options')}>
                    <a>
                        <span>
                            {t('messages:menuPrivacyOptions.message')}
                        </span>
                        <span className="arrow-right">
                            <img src={arrowRightImgSrc}/>
                        </span>
                    </a>
                </div>

                <div className="item" onClick={(e) => navigateTo(e, '/languages')}>
                    <a>
                        <span>
                            {t('messages:menuLanguages.message')}
                        </span>
                        <span className="arrow-right">
                            <img src={arrowRightImgSrc}/>
                        </span>
                    </a>
                </div>

                <div className="item">
                    <a id="help" onClick={goHelp}><span>{t('messages:menuHelp.message')}</span></a>
                </div>
                <div className="item">
                    <a id="myaccount" onClick={goMyAccount}><span>{t('messages:menuMyAcc.message')}</span></a>
                </div>

                { !props.data.current.isPremium && upgradeDiv }
                <div className="item" onClick={logOut}>
                    <a>
                        <span id="logoutLink">{t('messages:menuLogout.message')}</span>
                    </a>
                </div>
            </div>
        </div>
    )
};

Menu.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(Menu);