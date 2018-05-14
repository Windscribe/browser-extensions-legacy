import React from 'react';
import _ from 'underscore'
import { translate } from 'react-i18next';

const Switcher = (props) => {
    const update = (proxy, ourLocation, locations, userStatus, currentCountryName, e) => {
        e.preventDefault();
        if (userStatus) return;

        const location = _.find(locations, loc => loc.short_name === ourLocation);

        if (ourLocation && proxy) {
            chrome.runtime.sendMessage({action: 'SET_PROXY', data: false});
            chrome.runtime.sendMessage({action: 'SET_ICON', data: 'on'});

            chrome.runtime.sendMessage({action: 'CHANGE_LOCATION', data: location});
            chrome.runtime.sendMessage({action: 'CREATE_NOTIFICATION', data: {type: 'offDoubleHop'}});
        } else if (ourLocation && !proxy) {
            chrome.runtime.sendMessage({action: 'CREATE_NOTIFICATION', data: {type: 'externalApp'}});
        } else if (!ourLocation && proxy) {
            console.log('Turning proxy off here')
            chrome.runtime.sendMessage({action: 'CHANGE_APP_IS_ON', data: false})
            chrome.runtime.sendMessage({action: 'SET_PROXY', data: false});
            chrome.runtime.sendMessage({action: 'SET_ICON', data: 'off'});
            chrome.runtime.sendMessage({action: 'CREATE_NOTIFICATION', data: {type: 'off'}});
        } else if(!ourLocation && !proxy ) {
            chrome.runtime.sendMessage({action: 'CHANGE_APP_IS_ON', data: true})
            chrome.runtime.sendMessage({action: "SET_PROXY", data: true});
            chrome.runtime.sendMessage({action: 'SET_ICON', data: 'on'});
            chrome.runtime.sendMessage({action: 'CREATE_NOTIFICATION', data: {type: 'on', countryName: currentCountryName }});
        }
    }

    const upgradeTooltip = (
            <span className="upgradeTooltip" data-balloon={props.t('messages:upgradeTooltipText.message')}
                data-balloon-length="medium" data-balloon-pos="left">
            </span>
    );

    const powerImgSrc = require(`../../../assets/power_button_${props.proxy || !!props.ourLocation || false}@2x.png`);

    return (
        <div className="switcher">
            <img onClick={e => {
                    update(props.proxy, props.ourLocation, props.locations, props.userStatus, props.currentCountryName, e)
                }} src={powerImgSrc} width="79" />
            {props.userStatus === 'UPGRADE' && upgradeTooltip }
        </div>
    )
}

export default translate(['messages'], {wait: true})(Switcher);
