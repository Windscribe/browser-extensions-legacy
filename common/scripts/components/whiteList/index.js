import React from 'react';
import {Link} from 'react-router'
import _ from 'underscore';
import autobind from 'react-autobind';
import tld from 'tldjs';
import { addToWhiteListUtil } from '../helpers';
import { translate } from 'react-i18next';

import arrowLeftImgSrc from '../../../assets/arrow_left.png';
import checkmark from '../../../assets/checkmark@2x.png'

class WhiteList extends React.Component {
    constructor(props) {
        super(props);
        autobind(this);
        this.state = {
            currentDomain: tld.getDomain(this.props.data.current.toSecureLink),
            whiteListedDomains: [],
        }

        this.domainIsStillWhitelisted = this.domainIsStillWhitelisted.bind(this)
    }

    componentWillMount() {
        chrome.runtime.sendMessage({ action: 'RESET_REPORTED_WEBSITE' });
        const whiteListedDomains = Array.from(
            new Set(
                [...this.props.lists.whiteList, ...this.props.lists.proxyWhiteList, ...this.props.lists.cookieWhiteList]
            )
        )
        this.setState({ whiteListedDomains })
    }

    componentDidMount() {
        // Ps = perfect scrolling - external library connected in reactPopup.html
        try{
            Ps.initialize(document.getElementById('whiteListList'));
        } catch (e){
            console.log('error with scrollbar: '+ e.message);
        }
    }

    addToWhiteList(e) {
        e.preventDefault()
        addToWhiteListUtil(this.state.currentDomain, false, false);
    }

    addToProxyWhiteList(e) {
        e.preventDefault()
        addToWhiteListUtil(this.state.currentDomain, true, false);

    }

    domainIsStillWhitelisted(domain) {
        if (!domain) throw new Error('You need to supply a domain param')
        return (
            this.props.lists.proxyWhiteList.includes(domain) ||
            this.props.lists.whiteList.includes(domain) ||
            this.props.lists.cookieWhiteList.includes(domain)
        )
    }

    whiteList(domain, type) {
        if (type === 'proxy') {
            chrome.runtime.sendMessage({
                action: 'ADD_TO_PROXY_WHITELIST',
                data: { domain, noProxy: true }
            })
        } else if (type === 'ads') {
            chrome.runtime.sendMessage({
                action: 'ADD_TO_WHITELIST',
                data: { domain, noProxy: false }
            })
        } else if (type === 'cookies') {
            chrome.runtime.sendMessage({
                action: "ADD_TO_COOKIE_WHITELIST",
                data: { domain }
            })
        }

        // Check the current list and update whitelist
        if (!this.domainIsStillWhitelisted(domain)) {
            const updatedWhitelist = [...this.state.whiteListedDomains, domain]
            this.setState({ whiteListedDomains: updatedWhitelist })
        }
    }

    removeFromWhiteList(domain, name = null) {
        chrome.runtime.sendMessage({
            action: "REMOVE_FROM_WHITELIST",
            data: {
                domain,
                name
            }
        }, () => {
            if (!this.domainIsStillWhitelisted(domain)) {
                const updatedWhitelist = this.state.whiteListedDomains.filter(el => el !== domain)
                this.setState({ whiteListedDomains: updatedWhitelist })
            }
        });
    }

    handleClick(event, domain) {
        const name = event.target.getAttribute('name')
        console.log(domain, name)

        // Check the type of the even box clicked.  Then check the list which is releated to that box.  If it's whitelisted remove it otherwise add it
        if (name === 'proxy') {
            this.props.lists.proxyWhiteList.includes(domain) ?
                this.removeFromWhiteList(domain, name) :
                this.whiteList(domain, name)
        } else if (name === 'ads') {
            this.props.lists.whiteList.includes(domain) ?
                this.removeFromWhiteList(domain, name) :
                this.whiteList(domain, name)
        } else if (name === 'cookies') {
            this.props.lists.cookieWhiteList.includes(domain) ?
                this.removeFromWhiteList(domain, name) :
                this.whiteList(domain, name)
        } else {
            this.removeFromWhiteList(domain)
        }
    }

    reportWebsite() {
        if (!this.props.data.current.toSecureLink) return;
        chrome.runtime.sendMessage({
            action: "REPORT_WEBSITE",
            data: this.props.data.current.toSecureLink
        });
    }

    render() {
        const { t } = this.props;
        const isCurrentDomainWhiteListed = this.state.whiteListedDomains.includes(this.state.currentDomain) ||
            this.props.lists.proxyWhiteList.includes(this.state.currentDomain) ||
            this.props.lists.cookieWhiteList.includes(this.state.currentDomain);

        const whiteListElements = this.state.whiteListedDomains.map( el => (
            <td
                className="whiteList-item"
                key={el}
            >
                <td className='whiteList-item--header'>{el}</td>
                <td
                    name="proxy"
                    className='whiteList-item--item whiteList-item--check'
                    onClick={event => this.handleClick(event, el)}
                >
                    {
                        this.props.lists.proxyWhiteList.includes(el) ?
                            <img src={checkmark} alt="" style={{ pointerEvents: 'none' }} /> :
                            ''
                    }
                </td>
                <td
                    name="ads"
                    className='whiteList-item--item whiteList-item--check'
                    onClick={event => this.handleClick(event, el)}
                >
                    {
                        this.props.lists.whiteList.includes(el) ?
                            <img src={checkmark} alt="" style={{ pointerEvents: 'none' }} /> :
                            ''
                    }
                </td>
                <td
                    name="cookies"
                    className='whiteList-item--item whiteList-item--check'
                    onClick={event => this.handleClick(event, el)}
                >
                    {
                        this.props.lists.cookieWhiteList.includes(el) ?
                        <img src={checkmark} alt="" style={{ pointerEvents: 'none' }} /> :
                        ''
                    }
                </td>
                <td
                    onClick={e => this.handleClick(e, el)}
                    className="whiteList-item--close-button"
                >
                    <svg
                        fill="#FFFFFF"
                        height="24"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                        <path
                            d="M0 0h24v24H0z"
                            fill="none"
                        />
                    </svg>
                </td>
            </td>
        ));

        const proxyWhiteListElements = this.props.lists.proxyWhiteList.map( el =>
            <div className="whiteList-item" key={el}>
                <span className="whiteList-itemName">
                    <span className="whiteList-itemNoProxy">{t('messages:whiteListNoProxy.message')}: </span>
                    {el}
                </span>
                <span className="whiteList-itemRemove">{t('messages:remove.message')}</span>
            </div>
        );

        const deleteBtn = (
            <div
                id="deleteBtns"
                className="whiteListBtnsRegion"
            >
                <button
                    className={this.props.data.current.appIsOn ?
                        "copyLink-btn enabledText" :
                        "copyLink-btn disabledText"
                    }
                    id="deleteBtn"
                    onClick={e => this.handleClick(e, this.state.currentDomain)}
                >
                    {t('messages:whiteListRemoveBtnText.message')}
                </button>
            </div>
        );

        const addBtns = (
            <div id="whiteListBtns" className="whiteListBtnsRegion"
            >
                <div className="btn-container">
                    <button
                        className={this.props.data.current.appIsOn ?
                            "copyLink-btn whiteListOptionsBtns enabledText" :
                            "copyLink-btn whiteListOptionsBtns disabledText"
                        }
                        id="whiteListAdsBtn"
                        onClick={() => this.whiteList(this.state.currentDomain, 'ads')}
                    >
                        { t('messages:whiteListAddBtnText.message') }
                        <span>{t('messages:whiteListAddAdsBtnText.message')}</span>
                    </button>
                </div>
                <div className="btn-container">
                    <button
                        className={this.props.data.current.appIsOn ?
                            "copyLink-btn whiteListOptionsBtns enabledText" :
                            "copyLink-btn whiteListOptionsBtns disabledText"
                        }
                            id="whiteListProxyBtn"
                            style={{'float': 'right'}}
                            onClick={() => this.whiteList(this.state.currentDomain, 'proxy')}
                    >
                        { t('messages:whiteListAddBtnText.message') }
                        <span>{t('messages:whiteListAddProxyBtnText.message')}</span>
                    </button>
                </div>
                <div className="btn-container">
                    <button
                        className={this.props.data.current.appIsOn ?
                            "copyLink-btn whiteListOptionsBtns enabledText" :
                            "copyLink-btn whiteListOptionsBtns disabledText"
                        }
                            id="whiteListCookieBtn"
                            style={{'float': 'right'}}
                            onClick={() => this.whiteList(this.state.currentDomain, 'cookies')}
                    >
                        { t('messages:whiteListAddBtnText.message') }
                        <span>{t('messages:whiteListAddCookieBtnText.message')}</span>
                    </button>
                </div>
            </div>
        );

        const reportWebsite = (
            <span id="whiteListReport" onClick={!this.props.data.current.reportedWebsite && this.reportWebsite.bind(this)}>
                { !this.props.data.current.reportedWebsite ? t('messages:whiteListReportUrl.message') : t('messages:whiteListReportThanks.message') }
            </span>
        );

        return (
            <div className={ this.props.data.current.appIsOn ? "container enabled" : " container disabled"} >
                    <div className="navigation">
                        <div className="topNav">
                            <div className="top topSecondary">
                                <p className="title">{t('messages:whiteListTitle.message')}</p>
                                <Link to="/menu" className="mainScreenLink">
                                    <img src={arrowLeftImgSrc} />
                                    <span>{t('messages:backTitle.message'.message)}</span></Link>
                            </div>
                        </div>
                    </div>

                    <div id="whitelist-options">
                        <div id="whiteListIndicator">
                            <span id="whiteListLabel">{t('messages:whiteListQuestion.message')}</span>
                            { isCurrentDomainWhiteListed && reportWebsite}
                        </div>

                        { isCurrentDomainWhiteListed ? deleteBtn : addBtns }

                        <div className="whiteListList" id="whiteListList">
                            <table
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <tr
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        paddingTop: 25,
                                        borderBottom: 'solid 1px rgba(255, 255, 255, 0.3)'
                                    }}
                                >
                                    <th
                                        className="whiteList-header whiteList-header--domain"
                                        style={{
                                            width: 134,
                                            paddingLeft: 15,
                                            textAlign: 'left'
                                        }}
                                    >
                                        {t('messages:whiteListDomain.message')}
                                    </th>
                                    <th className='whiteList-header'>
                                        {t('messages:whiteListProxy.message')}
                                    </th>
                                    <th className='whiteList-header'>
                                        {t('messages:whiteListAds.message')}
                                    </th>
                                    <th className='whiteList-header'>
                                        {t('messages:whiteListCookies.message')}
                                    </th>
                                </tr>
                                { whiteListElements }
                            </table>
                            {/* { proxyWhiteListElements} */}
                        </div>
                    </div>
            </div>
        )
    }
}
export default translate(['messages'], {wait: true})(WhiteList)