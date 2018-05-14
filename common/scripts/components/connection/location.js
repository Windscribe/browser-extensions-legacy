import React, { PropTypes } from 'react'
import {Link} from 'react-router'
import { hashHistory } from 'react-router'
import { translate } from 'react-i18next';

const Locations = (props) => {
    const arrowImgSrc = require(`../../../assets/arrow_left.png`);
    const { t } = props;

    return (
        <div className={ props.data.current.appIsOn ? "container enabled" : " container disabled"} >
            <div className="navigation">
                <div className="topNav">
                    <div className="top topSecondary">
                        <p className="title">Locations</p>
                        <Link to="/" className="mainScreenLink">
                            <img src={arrowImgSrc}></img>
                            <span>{t('messages:backTitle.message')} </span></Link>
                    </div>
                </div>
            </div>
            <Location
                locations={props.data.locations}
                currentCountry={props.data.current.country}
                user={props.data.session.data}
                proxy={props.data.current.proxy}
                ourLocation={props.data.current.ourLocation}
            />
        </div>)
}

class Location extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        // Ps = perfect scrolling - external library connected in reactPopup.html
        try{
            Ps.initialize(document.getElementById('locations'));
        } catch (e){
            console.log('error with scrollbar: '+ e.message);
        }
    }

    update(selectedLocation) {
        if(this.props.user.status > 1) return;
        if(selectedLocation.premium_only && !this.props.user.is_premium) return chrome.tabs.create({url: "https://windscribe.com/upgrade?pcpid=ext_upgrade"});
        if(parseInt(selectedLocation.status) == 2 ) return;

        chrome.runtime.sendMessage({
            action: "CHANGE_LOCATION",
            data : selectedLocation
        });

        hashHistory.goBack()
    }
    render() {
        const checkMarkImgSrc = require(`../../../assets/checkmark.png`);
        const starImgSrc = require(`../../../assets/star.png`);

        const cruiseControl = {
            country_code : "",
            name : "Cruise control",
            short_name : "CR",
            status : 1,
            premium_only : 0
        };

        const locations = this.props.locations.map((location) =>  {
            const imgSrc = require(`../../../assets/flags/${location.country_code.toUpperCase()}.png`);
            return (
                <div onClick={ e => {this.update(location).bind(this)}  }
                    key={location.id}
                    className={( ( parseInt(location.premium_only) === 1 && !this.props.user.is_premium )
                    || parseInt(location.status) === 2) ? "not_allowed location_item" : "allowed location_item"}>
                    <span>
                      <img src={imgSrc}></img>
                    </span>
                    <span className="location">{location.name}</span>
                    <span>
                        {location.short_name == this.props.currentCountry.short_name && <img className="star" src={checkMarkImgSrc} width="18"></img>}
                        {(parseInt(location.premium_only) == 1 && !this.props.user.is_premium) && <div className="star">
                            <img src={starImgSrc}></img>
                        </div>}
                      </span>
                </div>
            )});

        return (
            <div className="locations" id="locations">
                <div className="cruiseControl"
                     onClick={e => {this.update(cruiseControl).bind(this)}}>
                <span className="name">
                    Cruise Control (Automatic)
                </span>
                    {(cruiseControl.short_name === this.props.currentCountry.short_name) &&
                    <img className="star" src={"../assets/checkmark.png"} width="18"></img>}
                </div>
                { locations }
            </div>
        )
    }
}

export default translate(['messages'], {wait: true})(Locations);
