import React from 'react'
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import { changeClientHeight } from '../helpers/'

import Item from './item';
import CookieMonster from './cookieMonster/'

const BlockingOptions = (props, context) => {
    const goBack = (e) => {
        e.preventDefault();
        context.router.push('/menu');
    }

    const goToWhiteList = (e) => {
        e.preventDefault();
        context.router.push('/whitelist');
    }

    const { t } = props;
    const arrowImgSrc = require(`../../../assets/arrow_left.png`);

    return (
        <div className={ props.data.current.appIsOn ? "options enabled" : "options disabled"}>
            <div className="topNav">
                <div className="top topSecondary">
                    <a id="menuBtn" onClick={goBack}>
                        <img src={arrowImgSrc}/><span>{t('messages:backTitle.message')} </span></a>
                    <span>{t('messages:privacyOptionsTitle.message')}</span>
                </div>
            </div>

            <div id="blocking-options">

                <Item
                    title={t('messages:privacyOptionsAntiSoc.message')}
                    note={t('messages:privacyOptionsAntiSocNote.message')}
                    firstItem="firstItem"
                    lastItem={false}
                    buttonState={props.listsStates.antiSocial}
                    onChangeEvent="CHANGE_ANTISOCIAL"
                    appIsOn={props.data.current.appIsOn}
                    t={props.t}
                />
                <Item
                    title={t('messages:privacyOptionsUntrace.message')}
                    note={t('messages:privacyOptionsUntraceNote.message')}
                    firstItem=""
                    lastItem={false}
                    buttonState={props.listsStates.untraceable}
                    onChangeEvent="CHANGE_UNTRACEABLE"
                    appIsOn={props.data.current.appIsOn}
                    t={props.t}
                />
                <Item
                    title={t('messages:privacyOptionsAdBlock.message')}
                    note={t('messages:privacyOptionsAdBlockNote.message')}
                    firstItem=""
                    lastItem={false}
                    buttonState={props.listsStates.adBlocker}
                    onChangeEvent="CHANGE_ADBLOCKER"
                    appIsOn={props.data.current.appIsOn}
                    t={props.t}
                />
                <Item
                    title={t('messages:privacyOptionsTime.message')}
                    note={t('messages:privacyOptionsTimeNote.message')}
                    firstItem=""
                    lastItem={false}
                    buttonState={props.listsStates.time}
                    onChangeEvent="CHANGE_TIME"
                    appIsOn={props.data.current.appIsOn}
                    t={props.t}
                />
                <Item
                    title={t('messages:privacyOptionsSplit.message')}
                    note={t('messages:privacyOptionsSplitNote.message')}
                    firstItem=""
                    lastItem={true}
                    buttonState={props.listsStates.splitPersonality}
                    onChangeEvent="CHANGE_SPLITPERSONALITY"
                    appIsOn={props.data.current.appIsOn}
                    t={props.t}
                />

                <CookieMonster
                    appIsOn={props.data.current.appIsOn}
                    adBlockOn={props.listsStates.adBlocker}
                    status={props.listsStates.cookieMonsterStatus}
                    t={props.t}
                />

                <div className="options-item">
                    <div className="child left-block">
                        <div>{t('messages:privacyOptionsWLTitle.message')}</div>
                        <div className="options-note">
                            {t('messages:privacyOptionsWLText.message')}
                        </div>
                    </div>
                    <div className="child right-block manage-white-list-btn-container">
                        <a id="whitelistOptions"
                           className={props.data.current.appIsOn ? "manage-whitelists-btn enabledText" : "manage-whitelists-btn disabledText"}
                           onClick={goToWhiteList}>{t('messages:privacyOptionsWLBtnText.message')}</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

BlockingOptions.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(BlockingOptions);
