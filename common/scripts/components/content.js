import React from 'react';
import Connection from "./connection/index.js"
import SecureLink from "./secureLink/index.js"
import Switcher from "./connection/switcher.js"
import WhiteListFooter from "./whiteList/WhiteListFooter.js"

function Content(props) {
    return (
        <div>
            <StatusBox current={props.data.current }
                       user={props.data.session.data}
                       locations={props.data.locations}
                       proxy={props.data.current.proxy}
                       userStatus={props.data.current.userStatus}
            />
            <SecureLink user={props.user}  data={props.data.current} router={props.router}/>
            <WhiteListFooter url={props.data.current.toSecureLink} lists={props.lists} listsStates={props.listsStates} appIsOn={props.data.current.appIsOn}/>
        </div>
    )
}

const StatusBox = (props) => {
    return (
        <div className="statusBlock">
            <div className="connection">
                <Connection
                    location={props.current.country}
                    currentMode={props.current.currentMode}
                    user={props.user}
                    proxy={props.proxy}
                    userStatus={props.userStatus}
               />
            </div>
            <Switcher proxy={props.current.proxy}
                      ourLocation={props.current.ourLocation}
                      locations={props.locations}
                      userStatus={props.current.userStatus}
                      currentCountryName={props.current.country.name}
            />
        </div>
    )
}

export default Content;
