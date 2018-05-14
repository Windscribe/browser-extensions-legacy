import React, { PropTypes } from 'react'
import {Link} from 'react-router'
import { translate, changeLanguage  } from 'react-i18next';

// to change language use i18n.changeLanguage(lng)
import i18n from '../../i18n';

const Languages = (props, context) => {
    const arrowImgSrc = require(`../../../assets/arrow_left.png`);
    const { t } = props;

    return (
        <div className={ props.data.current.appIsOn ? "container enabled" : " container disabled"} >
            <div className="navigation">
                <div className="topNav">
                    <div className="top topSecondary">
                        <p className="title">Languages</p>
                        <Link to="/menu" className="mainScreenLink">
                            <img src={arrowImgSrc}></img>
                            <span>{t('messages:backTitle.message')} </span></Link>
                    </div>
                </div>
            </div>
            <Lang
                languages={props.lists.languagesList}
                currentLng={props.listsStates.currentLng}
                router={context.router}
                user={props.data.session.data}
            />
        </div>)
}

class Lang extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        // Ps = perfect scrolling - external library connected in reactPopup.html
        try{
            Ps.initialize(document.getElementById('languages'));
        } catch (e){
            console.log('error with scrollbar: '+ e.message);
        }
    }

    update(lngCode) {
        chrome.runtime.sendMessage({
            action: 'CHANGE_CURRENT_LNG',
            data : lngCode
        });

        i18n.changeLanguage(lngCode)

        this.props.router.push('/')
    }
    render() {
        const checkMarkImgSrc = require(`../../../assets/checkmark.png`);

        const languages = this.props.languages.map((lng) =>  {
            const imgSrc = require(`../../../assets/flags/${lng.flagCode}.png`);
            return (
                <div className="location_item" onClick={ e => {this.update(lng.lngCode).bind(this)}  }
                    key={lng.lngCode}
                >
                    <span>
                      <img src={imgSrc}></img>
                    </span>
                    <span className="location">{lng.name}</span>
                    <span>
                        {lng.lngCode == this.props.currentLng && <img className="star" src={checkMarkImgSrc} width="18" />}
                    </span>
                </div>
            )});

        return (
            <div className="locations" id="languages">
                { languages }
            </div>
        )
    }
}

Languages.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(Languages);
