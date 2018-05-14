import React, { Component } from 'react'
import PropTypes from 'prop-types';
import tld from 'tldjs';
import { findDOMNode } from 'react-dom'
import { translate } from 'react-i18next';
import autobind from 'react-autobind';

import { addToWhiteListUtil, changeClientHeight } from '../helpers';

const arrowRigthImgSrc = require(`../../../assets/arrow_right.png`);

class WhiteListFooter extends Component {
    constructor(props, context) {
        super(props, context)
        autobind(this)

        this.t = props.context
        this.context = context
        this.currentDomain = tld.getDomain(props.url)
        this.domainIsWhiteListed = this.props.lists.whiteList.indexOf(this.currentDomain) > -1 || this.props.lists.proxyWhiteList.indexOf(this.currentDomain) > -1;

        this.state = {
            optionsToggled: false,
            toggles: {
                ads: false,
                cookies: false,
                proxy: false
            },
        }
    }
    componentWillMount() {
        // const ops = Object.assign({}, this.state.toggles)
        console.log(this.props.listsStates)
        const whiteList = this.props.lists.whiteList
        const proxyWhiteList = this.props.lists.proxyWhiteList;
        const cookieWhiteList = this.props.lists.cookieWhiteList;
        // Check if current domain is in whitelist currently
        this.setState({
           toggles: {
               ads: whiteList.includes(this.currentDomain),
               cookies: cookieWhiteList.includes(this.currentDomain),
               proxy: proxyWhiteList.includes(this.currentDomain)
           }
        })

    }
    handleClickEvent(event) {
        // When toggling a checkbox the
        if (
            event.target.type &&
            event.target.type === 'checkbox' &&
            event.target.classList.contains('whiteListToggleInput')
        ) return
        const el = event.target
        const elClass = el.classList
        // If it's not anything in the whitelist ui toggle it closed
        if (!elClass.contains('whiteListToggleLabel')) {
            this.toggleOptions()
        }
    }
    toggleOptions() {
        if (this.state.optionsToggled) {
            changeClientHeight()
            this.setState({ optionsToggled: false })
            document.removeEventListener('click', this.handleClickEvent)
        } else {
            changeClientHeight(470)
            this.setState({ optionsToggled: true })
            // Set listener
            document.addEventListener('click', this.handleClickEvent, { passive: true })
        }
    }
    whiteList(type) {
        if (!this.props.url) return;
        const domain = this.currentDomain
        const noProxy = this.state.toggles.proxy
        return new Promise(
            resolve => chrome.runtime.sendMessage(
                { action: 'ADD_TO_WHITELIST', data: { domain, noProxy } },
                () => resolve()
            )
        )
    }
    whiteListProxy() {
        if (!this.props.url) return;
        const domain = this.currentDomain
        const noProxy = this.state.toggles.proxy
        return new Promise(
            resolve => chrome.runtime.sendMessage(
                { action: 'ADD_TO_PROXY_WHITELIST', data: { domain, noProxy } },
                () => resolve()
            )
        )
    }
    whiteListCookies() {
        if (!this.props.url) return;
        const domain = this.currentDomain
        return new Promise(
            resolve => chrome.runtime.sendMessage(
                { action: 'ADD_TO_COOKIE_WHITELIST', data: { domain } },
                () => resolve()
            )
        )
    }

    whiteListAll() {
       this.whiteList()
        .then(this.whiteListProxy)
        .then(this.whiteListCookies)
    }
    removeFromWhiteList(el) {
        if (!this.props.url) return;
        chrome.runtime.sendMessage({
            action: "REMOVE_FROM_WHITELIST",
            data: {
                domain: this.currentDomain,
                name: el.name
            }
        });
    }
    handleToggelChange(event) {
        const el = event.target
        const ops = Object.assign({}, this.state.toggles)

        if (el.name === 'all') {
            // If none are checked, check them all
            if (!el.checked) {
                ops.ads = false
                ops.cookies = false
                ops.proxy = false
            } else {
                ops.ads = true
                ops.cookies = true
                ops.proxy = true
            }
        }

        ops[el.name] = el.checked

        if (el.checked) {
            this.setState({ toggles: ops },
                () => {
                    if (el.name === 'all') {
                        this.whiteListAll()
                    } else if (el.name === 'cookies') {
                        this.whiteListCookies()
                    } else if (el.name === 'proxy') {
                        this.whiteListProxy()
                    } else {
                        this.whiteList()
                    }
                }
            )
        } else {
            // Remove from whitelist
            this.setState({ toggles: ops }, this.removeFromWhiteList(el))
        }

        // setTimeout(() => console.log(JSON.parse(localStorage.getItem('wsextension_listsInfo'))), 1000)
    }

    render() {
        return (
            <div
                className="whiteList-region"
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <div className="footer-top-container">
                    <span className="whiteListLabel" id="whiteListIndicator-mainScreen">
                        { this.domainIsWhiteListed ? this.props.t('messages:whiteListListed.message') : this.props.t('messages:whiteListIssues.message') }
                    </span>

                    <div
                        id="btnRegion"
                        onClick={this.toggleOptions}
                        style={{
                            float: 'right',
                            position: 'relative'
                        }}
                    >
                        <span id="whiteList" style={{ fontSize: 13 }}>
                            {this.props.t('messages:whiteListIt.message')}
                            <img
                                src={arrowRigthImgSrc}
                                alt="arrow-right"
                                style={
                                    this.state.optionsToggled ?
                                    { transform: 'rotate(-90deg)' } :
                                    { transform: 'rotate(90deg)' }
                                }
                            />
                        </span>
                    </div>
                </div>

                <form
                    className="whiteListForm"
                    style={{
                        flex: '1 1 100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'center',
                        fontSize: 15
                    }}
                >
                    <div className="whitelistAll">
                        <input
                            id="whitelist_all_params"
                            type="checkbox"
                            className="whiteListToggleInput"
                            name="all"
                            onChange={this.handleToggelChange}
                            checked={
                                ( this.state.toggles.proxy &&
                                this.state.toggles.ads &&
                                this.state.toggles.cookies ) ?
                                true:
                                false
                            }
                        />
                        <label htmlFor="whitelist_all_params" className="whiteListToggleLabel">
                            {this.props.t('messages:whiteListAll.message')}
                            <svg
                                fill="#FFF"
                                height="30"
                                viewBox="0 0 24 24"
                                width="36"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M0 0h24v24H0z"
                                    fill="none"
                                />
                                <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                            </svg>
                        </label>
                    </div>
                    <div className="proxy">
                        <input
                            id="disable_proxy_check"
                            type="checkbox"
                            className="whiteListToggleInput"
                            name="proxy"
                            onChange={this.handleToggelChange}
                            checked={this.state.toggles.proxy}
                        />
                        <label htmlFor="disable_proxy_check" className="whiteListToggleLabel">
                            {this.props.t('messages:whiteListDirectConnection.message')}
                            <svg fill="#FFF" height="30" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                            </svg>
                        </label>
                    </div>

                    {
                        this.props.listsStates.adBlocker ?
                        (
                            <div className="ads">
                                <input
                                    id="allow_ads_check"
                                    type="checkbox"
                                    className="whiteListToggleInput"
                                    name="ads"
                                    onChange={this.handleToggelChange}
                                    checked={this.state.toggles.ads}
                                />
                                <label htmlFor="allow_ads_check" className="whiteListToggleLabel">
                                    {this.props.t('messages:whiteListAllowAds.message')}
                                    <svg fill="#FFF" height="30" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                    </svg>
                                </label>
                            </div>
                        ) : ''
                    }
                    {
                        this.props.listsStates.cookieMonsterStatus.current !== 0 ?
                        (
                            <div className="cookies">
                                <input
                                    id="disable_cookie_delete_check"
                                    type="checkbox"
                                    className="whiteListToggleInput"
                                    name="cookies"
                                    onChange={this.handleToggelChange}
                                    checked={this.state.toggles.cookies}
                                />
                                <label htmlFor="disable_cookie_delete_check" className="whiteListToggleLabel">
                                    {this.props.t('messages:whiteListAllowCookies.message')}
                                    <svg fill="#FFF" height="30" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                    </svg>
                                </label>
                            </div>
                        ) : ''
                    }
                </form>
            </div>
        )
    }
}

WhiteListFooter.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(WhiteListFooter);
