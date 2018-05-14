import React from 'react';
import _ from 'underscore';
import Modal from 'react-bootstrap-modal';
import ReactHtmlParser from 'react-html-parser';
import { translate } from 'react-i18next';

import '../../css/rbm-complete.css';

const Navigation = (props) => {
    const openMenu = (e) => {
        e.preventDefault();
        props.router.push('/menu')
    }

    const menuImgSrc = require(`../../assets/menu@2x.png`);
    const logoImgSrc = require(`../../assets/logo@2x.png`);
    const proImgSrc = require(`../../assets/pro-icon.png`);

    return (
        <span>
              <a id="menuBtn" onClick={openMenu}>
                  <img src={menuImgSrc} width="18" />
              </a>
              <span>
                  <img id="logo" src={logoImgSrc} width="90" />
                  { ( props.traffic === 'PREMIUM' ) && <img src={proImgSrc} width="" />}
              </span>
          </span>
    )
}

const UserStatus = (props) => {
    const goToUpgrade = () => {
        let url = `${props.rootUrl}upgrade?pcpid=ext_upgrade`;
        url = (props.traffic === 'PREMIUM') ? url.concat(`&ext_session=${props.sessionAuthHash}`) : url;

        chrome.tabs.create({ url })
    }

    const { t } = props;
    const trafficLeft = ( Number.parseFloat(props.traffic) <= 0 ) ? 0 : Number.parseFloat(props.traffic);

    let traffic;
    if (!_.isNaN(Number.parseFloat(props.traffic)) ) traffic = (
        <span className="userStatusDefault" onClick={goToUpgrade.bind(this)}>
              {`${trafficLeft} ${t('messages:topNavGBLeft.message')}`}
          </span>
    );

    switch (props.traffic) {
        case "PREMIUM":
            if (props.rebill === 0) {
                const daysLeft = Math.ceil((Date.parse(props.premiumExpiryDate) - Date.now()) / 86400000);
                if (daysLeft <= 5) {
                    traffic = (
                        <span className="userStatusDefault">
                              {`${daysLeft} ${t('messages:topNavDaysLeft.message')}`}
                          </span> );
                }
                if (daysLeft <= 1) {
                    traffic = (
                        <span className="userStatusDefault">
                              {`${daysLeft} ${t('messages:topNavDayLeft.message')}`}
                          </span> );
                }
                if (daysLeft <= 0) {
                    traffic = (
                        <span className="userStatusDefault">
                              {`0 ${t('messages:topNavDayLeft.message')}`}
                          </span> );
                }
            }
            break;
        case "UPGRADE":
            traffic = (
                <span onClick={goToUpgrade}>
                      <span className="userStatusDefault">{`${t('messages:topNavUpgrade.message').toUpperCase()}`}</span>
                </span>
            );
            break;
        case "BANNED":
            traffic = ( <span className="userStatusDefault">{`${t('messages:topNavBanned.message').toUpperCase()}`}</span> );
            break;
        default:
            traffic = traffic || '';
    }

    return (
        <span className="userStatus">
        { traffic }
      </span>
    )
}

class Notifications extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newNotifications: _.filter(this.props.notificationsList, item => !_.contains(this.props.notificationsShown, item.id) ),
            notificationMessage: '',
            notificationTitle: '',
            notificationIndex: null,
            showModal: false
        };

        this.navigateTo.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            newNotifications: _.filter(nextProps.notificationsList, item => !_.contains(nextProps.notificationsShown, item.id) )
        })
    }

    openNotification() {
        const lastUnread = _.find(this.props.notificationsList, (item) => !_.contains(this.props.notificationsShown, item.id))
        const notification = lastUnread ? lastUnread : this.props.notificationsList[0];

        this.setState({
            showModal: true,
            notificationMessage: notification.message,
            notificationTitle: notification.title,
            notificationIndex: lastUnread ? _.findIndex(this.props.notificationsList, item => item.id === lastUnread.id) : 0
        });

        lastUnread && chrome.runtime.sendMessage({
            action: 'ADD_SHOWN_NOTIFICATION',
            data: lastUnread.id
        })
    }

    close(e) {
        e.preventDefault();
        this.setState({showModal: false});
    }

    navigateTo(index){
        const arrLength = this.props.notificationsList.length;
        if (index < 0 || index >= arrLength) return;

        this.setState({
            notificationMessage: this.props.notificationsList[index].message,
            notificationTitle: this.props.notificationsList[index].title,
            notificationIndex: index
        });

        !_.contains(this.props.notificationsShown, this.props.notificationsList[index].id) && chrome.runtime.sendMessage({
            action: 'ADD_SHOWN_NOTIFICATION',
            data: this.props.notificationsList[index].id
        })
    }

    render() {
        const that = this;
        const bellSrc = require(`../../assets/notification-icon.png`);
        const dotSrc = require(`../../assets/notification-light-glow.png`);
        const closeBtnSrc = require(`../../assets/cancel.png`);
        const arrowLeftSrc = require(`../../assets/arrow_left_gray.png`);

        const notificationBtns = (
            <div className="notificationsBtns">
                <span
                    onClick={() => that.navigateTo(this.state.notificationIndex - 1)}
                    className={ (this.state.notificationIndex > 0 &&
                                this.props.notificationsList.length > 1 ) ? "activeBtn" : ''  }
                >prev</span>
                <span>|</span>
                <span
                    onClick={() => that.navigateTo(this.state.notificationIndex + 1)}
                    className={ (this.state.notificationIndex < this.props.notificationsList.length - 1 &&
                                this.props.notificationsList.length > 1) ? "activeBtn" : ''}
                >next</span>
            </div>
        )

        return (
            <span className="notifications" onClick={this.openNotification.bind(this)}>
                <img src={bellSrc} className={ (!this.props.newInstall && this.state.newNotifications.length > 0) ? 'active' : ''} />
                {!this.props.newInstall && this.state.newNotifications.length > 0 && <img src={dotSrc} className="activeDot active" /> }
                <Modal
                    show={this.state.showModal}
                    onHide={this.close.bind(this)}
                    aria-labelledby="ModalHeader"
                >
                  <Modal.Header>
                      <Modal.Title id='ModalHeader'>
                          <img src={arrowLeftSrc} onClick={this.close.bind(this)} />
                          { this.state.notificationTitle }
                      </Modal.Title>
                      <img src={closeBtnSrc} onClick={this.close.bind(this)} />
                  </Modal.Header>
                  <Modal.Body>
                    <p>{ ReactHtmlParser(this.state.notificationMessage)}
                    </p>
                      {notificationBtns}
                  </Modal.Body>
                </Modal>
            </span>
        )

    }
}

const TopNavigation = (props) => {
    return (
        <div className="navigation home">
            <div className="topNav">
                <div className="top">
                    <Navigation
                        router={props.router}
                        traffic={props.traffic}
                    />

                        <span className="userInfo">
                            <UserStatus traffic={props.traffic}
                                        rootUrl={props.rootUrl}
                                        sessionAuthHash={props.sessionAuthHash}
                                        premiumExpiryDate={props.premiumExpiryDate}
                                        rebill={props.rebill}
                                        t={props.t}
                            />
                            <Notifications
                                newInstall={props.newInstall}
                                notificationsList={props.notificationsList}
                                notificationsShown={props.notificationsShown}
                            />
                        </span>
                </div>
            </div>
        </div>
    )
}

// export default TopNavigation;
export default translate(['messages'], {wait: true})(TopNavigation);
