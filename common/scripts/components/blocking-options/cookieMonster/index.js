import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { translate } from 'react-i18next'
import autobind from 'react-autobind'

class CookieMonster extends Component {
    constructor(props) {
        super(props)
        autobind(this)

        this.state = {
            CM_STATUS: 0,
            dropdownShowing: false
        }

        this.t = this.props.t
    }
    componentWillMount() {
        console.log(this.props)
        this.setState({ CM_STATUS: this.props.status.current })
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.adBlockOn === nextProps.adBlockOn) {
            return;
        }

        if (!nextProps.adBlockOn) {
            console.log('Disabled ad block... Turning off CM')
            this.toggleCM({ current: 0, previous: this.state.CM_STATUS })
            this.setState({ CM_STATUS: 0 })
        } else {
            console.log('Enabled ad block... Turning on CM')
            this.toggleCM({ current: nextProps.status.previous, previous: nextProps.status.current })
            this.setState({ CM_STATUS: nextProps.status.previous })
        }
    }
    addClickEvent() {
        document.addEventListener('click', this.handleDocumentClick, { passive: true })
    }
    removeClickEvent() {
        document.removeEventListener('click', this.handleDocumentClick)
    }
    translateCM_STATUS(status) {
        switch(status) {
            case 0:
                return this.t('messages:cookieMonsterCookieOff.message')
            case 1:
                return this.t('messages:cookieMonsterCookie3rdParty.message')
            case 2:
                return this.t('messages:cookieMonsterCookieAll.message')
            default:
                return null
        }
    }
    toggleDropdown() {
        if (this.state.dropdownShowing) {
            this.removeClickEvent()
            this.setState({ dropdownShowing: false })
        } else {
            this.setState({ dropdownShowing: true })
        }
    }
    toggleCM(status) {
        chrome.runtime.sendMessage({
            action: 'UPDATE_COOKIE_MONSTER_FLAG',
            data: status
        })
    }
    handleDocumentClick(event) {
        const container = findDOMNode(this)

        if (container.contains(event.target) && container !== event.target) {
            return;
        }
        this.removeClickEvent()
        this.toggleDropdown()
    }
    handleDropdownClick(event) {
        this.addClickEvent()
        this.toggleDropdown()
    }
    handleDropdownSelect(status) {
        const payload = { current: status, previous: this.state.CM_STATUS }
        this.setState({ CM_STATUS: status })
        this.toggleCM(payload)
        this.removeClickEvent()
        this.toggleDropdown()
    }
    render() {
        return (
            <div
                className="options-item"
                disabled={!this.props.adBlockOn}
                style={{
                    transition: 'opacity ease 0.3s',
                    opacity: !this.props.adBlockOn ? '0.5' : '1',
                    pointerEvents: !this.props.adBlockOn ?  'none' : 'all'
                }}
            >
                <div className="child left-block">
                    <div>{this.t('messages:cookieMonsterTitle.message')}</div>
                    <div className="options-note">
                        {this.t('messages:cookieMonsterOptionsNote.message')}
                    </div>
                </div>
                <div className="child right-block manage-white-list-btn-container">
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            width: 130,
                            zIndex: 1
                        }}
                    >
                        <button
                            className={this.props.appIsOn ? "manage-whitelists-btn enabledText" : "manage-whitelists-btn disabledText"}
                            onClick={this.handleDropdownClick}
                        >
                            {this.translateCM_STATUS(this.state.CM_STATUS)}
                        </button>
                        <div
                            className={`dropdown ${ this.state.dropdownShowing && 'showing' }`}
                        >
                            <ul>
                                <li
                                    onClick={() => this.handleDropdownSelect(0)}
                                >
                                    {this.t('messages:cookieMonsterCookieOff.message')}
                                </li>
                                <li
                                    onClick={() => this.handleDropdownSelect(1)}
                                >
                                    {this.t('messages:cookieMonsterCookie3rdParty.message')}
                                </li>
                                <li
                                    onClick={() => this.handleDropdownSelect(2)}
                                >
                                    {this.t('messages:cookieMonsterCookieAll.message')}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default CookieMonster