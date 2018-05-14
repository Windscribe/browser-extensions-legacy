import React from 'react'
import {hashHistory} from "react-router";
import _ from "underscore";
import { translate } from 'react-i18next';
const SET_LINK_OPTIONS = "SET_LINK_OPTIONS"

const SecureLink = (props) => {
  function navigate(e) {
    e.preventDefault();
    (props.location.state && props.location.state.fromContextMenu) ? window.close() : hashHistory.goBack();
  }

  const { t } = props;
  const store = props.data;
  const current = _.has(store,'current') ? store.current : {}
  const secureLinkId = _.has(current,'secureLinkId') ? current.secureLinkId :  ""
  const user =  _.has(store,'session') ? store.session.data : {}
  if (user.status > 1) hashHistory.push('/');

  const arrowLeftImgSrc = require(`../../../assets/arrow_left.png`);

  return (
      <div className={ props.data.current.appIsOn ? "container enabled" : " container disabled"}>
        <div className="navigation">
          <div className="topNav">
            <div className="top topSecondary">
              <span className="mainScreenLink" onClick={navigate}>
                <img src={arrowLeftImgSrc}></img>
                <span>{t('messages:backTitle.message')}</span>
              </span>
              <span className="title">{t('messages:secLinkTitle.message')}</span>
            </div>
          </div>
        </div>
        <Options
            secureLink={current.secureLink}
            linkId={secureLinkId}
            status={user.status}
            copied={current.secureLinkCoppied}
            fromContextMenu={props.location.state && props.location.state.fromContextMenu}
            t={props.t}
        />
      </div>
  )
}

function copyTextToClipboard(text) {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.className = "unvisibleInput";
    document.body.appendChild(textArea);
    textArea.select();
    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (err) {
        successful = false;
    }
    document.body.removeChild(textArea);
    return successful
}

class Options extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      linkOption: {
        password: "",
        message: "",
        force_install: false,
        secure_link_display_id: this.props.linkId
      }
    };

    props.copied && copyTextToClipboard(props.secureLink)
  }

  componentWillReceiveProps(nextProps) {
    nextProps.copied && copyTextToClipboard(nextProps.secureLink);

    if (nextProps.linkId !== this.props.linkId) this.setState({
      linkOption: {
        password: this.state.linkOption.password,
        message: this.state.linkOption.message,
        force_install: this.state.linkOption.force_install,
        secure_link_display_id: nextProps.linkId
    }})
  }

  handleChange(event) {
    event.persist()
    this.setState((prev,next) => {prev.linkOption[event.target.id] = event.target.value})
  }

  handleCheck(event) {
    event.persist()
    this.setState((prev,next) => {prev.linkOption.force_install = !prev.linkOption.force_install})

  }

  handleSubmit(e) {
    e.preventDefault();
    const invalidPassword = this.state.linkOption.password.length > 0 && this.state.linkOption.password.length < 4;
    if (invalidPassword || this.props.status > 1 || !this.state.linkOption.secure_link_display_id) return;
    const linkOptions = _.pick(this.state.linkOption, (val) => _.isBoolean(val) || val !== '');
    chrome.runtime.sendMessage({
      action: SET_LINK_OPTIONS,
      data : linkOptions
    });
    this.props.fromContextMenu ? window.close() : hashHistory.goBack();
  }

  render () {
    const { t } = this.props;
    const invalidPassword = this.state.linkOption.password.length > 0 && this.state.linkOption.password.length < 4;
    const forceInsImgSrc = require(`../../../assets/forceinstall@2x.png`);
    return(
        <div>
          <div className="link-copied">
            {this.props.copied ? t('messages:secLinkCopied.message') : t('messages:secLinkNotCopied.message')}
          </div>
          <div className="link-container">

            <input type="text" className="secureLink withlock" id="password" onChange={e => this.handleChange(e)}
                   placeholder={t('messages:secLinkAddPsw.message')} />
            <input type="text" className="secureLink withmessage" id ="message" onChange={e => this.handleChange(e)}
                   placeholder={t('messages:secLinkAddMsg.message')} />
            <span className="password-reject">{invalidPassword && t('messages:secLinkWarn.message')}</span>
            <div className="forceInstall">
              <div className="force-label">
                <img src={forceInsImgSrc} width="11" />
                <span>{t('messages:secLinkForceIns.message')}</span>
              </div>
              <div onClick={e => this.handleCheck(e)} className={(this.state.linkOption.force_install ? "checked " : "") + "onoffswitch"}>
                <label className="onoffswitch-label" >
                <span className="onoffswitch-inner">
                </span>
                  <span className="onoffswitch-switch" ></span>
                </label>
              </div>
            </div>
            <div className="slink-note">
                {t('messages:secLinkNote.message')}
            </div>
            <input type="button" value="Save" onClick={e => this.handleSubmit(e)} />
          </div>
        </div>
    )
  }
}

export default translate(['messages'], {wait: true})(SecureLink);
