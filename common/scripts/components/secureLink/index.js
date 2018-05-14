import React from 'react'
import { isUrl, canBeSecureLink } from '../helpers';
const SET_SECURE_LINK = "SET_SECURE_LINK"
const UPDATE_SECURE_LINK = "UPDATE_SECURE_LINK"
import { translate } from 'react-i18next';

const SecureLink = (props) => {
    return (
        <div className="secure_link">
            <div className="top_title">
                <span>{props.t('messages:secureLinkTitle.message')}</span>
                <div className="help">
                    <a href="https://windscribe.com/securelink" target="_blank"><span>?</span></a>
                </div>
            </div>
            <LinkGenerator user={props.user}
                           link={props.data.toSecureLink}
                           updateLink={props.data.secureLink}
                           copied={props.data.secureLinkCoppied}
                           router={props.router}
                           t={props.t}
            />
        </div>
    )
}

class LinkGenerator extends React.Component{
    constructor(props) {
        super(props)
        this.state = {}
    }

    update() {
        if ( !canBeSecureLink(this.state.link) || !isUrl(this.state.link)) return;
        chrome.runtime.sendMessage({
            action: SET_SECURE_LINK,
            link : this.state.link
        });
        this.props.router.push('/secure_link')
    }

    updateLink(e) {
        this.setState({link : e.target.value})
    }

    componentWillMount() {
        this.state.link = this.props.link
    }

    makeBtn(){
        if ( !canBeSecureLink(this.state.link) || !isUrl(this.state.link) ) {
            return (
                <button onClick={e => this.update()} data-balloon={this.props.t('messages:secureLinkErrTooltip.message')}
                        data-balloon-length="large"
                >
                    {this.props.t('messages:secureLinkBtnText.message').toUpperCase()}
                </button>
            )
        } else {
            return (
                <button onClick={e => this.update()}>
                    {this.props.t('messages:secureLinkBtnText.message').toUpperCase()}
                </button>
            )
        }
    }


    render () {
        return (
            <div className="link_generator">
                <input type="text" value={this.state.link} onChange={e => this.updateLink(e)} />
                { this.makeBtn.bind(this)()}
            </div>
        )
    }
}

export default translate(['messages'], {wait: true})(SecureLink);
