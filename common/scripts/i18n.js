import i18n from 'i18next';
import XHR from 'i18next-xhr-backend';
import listsStore from './store/listsStore.js'
import { changeCurrentLng } from './actions/listsActionsCreators';

i18n
    .use(XHR)
    .init({
        // "debug": true,
        "lng": listsStore.getState().listsInfo.getIn(["state", "currentLng"]) || window.navigator.language,
        "fallbackLng": "en",
        "ns": 'messages',
        "defaultNS": 'messages',
        "load": 'languageOnly',
        "backend": {
            "loadPath": "../_locales/{{lng}}/{{ns}}.json"
        }
    }, (err, t) => {
        if (listsStore.getState().listsInfo.getIn(["state", "currentLng"])) return;
        const lng = window.navigator.language.split('-')[0];
        const lngData = listsStore.getState().listsInfo.getIn(['lists', 'languagesList']).find(item => item.get('lngCode') === lng);
        const currentLngCode = lngData ? lngData.get('lngCode') : 'en';

        listsStore.dispatch(changeCurrentLng(currentLngCode));
        // initialized and ready to go!
    });

export default i18n;