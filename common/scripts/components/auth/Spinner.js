import React from 'react';

const Spinner = (props) => {
    const logoImgSrc = require(`../../../assets/logo@2x.png`);

    return (
        <div id="loading" className="loading-container">
            <div id="loadingTab" className="animated fadeIn">
                <div className="topNav">
                    <div className="top topSecondary" style={{"textAlign": "center"}}>
                        <span><img src={logoImgSrc} style={{'width': "90px" }}/> </span>
                    </div>
                </div>
                <div className="loading-body">
                    <div className="loading-text">{ props.message }</div>
                    <div className="cp-spinner cp-round"></div>
                </div>
            </div>
        </div>
    )
}

export default Spinner;