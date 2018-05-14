import React from 'react'
import PropTypes from 'prop-types';
import _ from 'underscore';
import CopyToClipboard from 'react-copy-to-clipboard';
import { translate } from 'react-i18next';

class RecentLinks extends React.Component {

    _bind(...methods) {
        _.each(methods, (method) => this[method] = this[method].bind(this));
    }

    constructor(props) {
        super(props);
        this._bind('onNoLinks', 'copyLink', 'remove', 'rankLinks', 'goToMenu', 'tryDelete', 'deleteNo');
        this.state = {
            data: this.props.recentLinks,
            noLinks: !this.props.recentLinks,
            todayList: null,
            lastWeekList: null,
            lastMonthList: null,
            olderList: null,
            deleteState: {},
            copy: ''
        };
    }

    componentWillMount() {
        this.rankLinks();
    }

    componentDidMount() {
        // Ps = perfect scrolling - external library connected in reactPopup.html
        try{
            Ps.initialize(document.getElementById('recentLinks'));
        } catch (e){
            console.log('error with scrollbar: '+ e.message);
        }
    }

    rankLinks() {
        if (this.state.data) {
            _.map(this.state.data, item => {
                this.state.deleteState[item.secure_link_display_id] = false;
            });
            const todayDate = new Date();
            todayDate.setHours(0);
            todayDate.setMinutes(0);
            todayDate.setSeconds(0);
            todayDate.setMilliseconds(0);
            const today = parseInt(todayDate.getTime() / 1000);
            const lastWeek = parseInt((new Date().getTime() / 1000) - 604800);
            const lastMonth = parseInt((new Date().getTime() / 1000) - 2592000);
            this.setState({
                todayList: this.state.data.filter(function (item) {
                    return Number(item.created_timestamp) > today;
                })
            });
            this.setState({
                lastWeekList: this.state.data.filter(function (item) {
                    return Number(item.created_timestamp) < today && Number(item.created_timestamp) > lastWeek;
                })
            });
            this.setState({
                lastMonthList: this.state.data.filter(function (item) {
                    return Number(item.created_timestamp) < lastWeek && Number(item.created_timestamp) > lastMonth;
                })
            });
            this.setState({
                olderList: this.state.data.filter(function (item) {
                    return Number(item.created_timestamp) < lastMonth;
                })
            });
        }
    }

    onNoLinks(e) {
        e.preventDefault();
        chrome.tabs.create({url: this.props.data.rootUrl + "securelink"});
    }

    copyLink(item) {
        const element = document.getElementById('copy' + item.secure_link_display_id);
        this.state.copy = item.secure_url;
        element.innerText = this.props.t('messages:recentLinksCopied.message');
    }

    remove(item, type) {
        chrome.runtime.sendMessage({action: 'DELETE_LINK', data: item.secure_link_display_id});
        let obj = {};
        obj[type] = _.without(this.state[type], _.findWhere(this.state[type], {
            secure_link_display_id: item.secure_link_display_id
        }));
        this.setState(obj);
    }

    goToMenu(e) {
        e.preventDefault();
        this.context.router.push('/menu');
    }

    tryDelete(id) {
        const obj = this.state.deleteState;
        obj[id] = true;
        this.setState({
            deleteState: obj
        });
    }

    deleteNo(id) {
        const obj = this.state.deleteState;
        obj[id] = false;
        this.setState({
            deleteState: obj
        });
    }

    render() {
        const { t } = this.props;
        const arrowLeftImgSrc = require(`../../../assets/arrow_left.png`);
        const that = this;
        const itemTemplate = (item, type) => {
            const title = item.page_title.length >= 25 ? item.page_title.substring(0, 25) + "..." : item.page_title;
            item.deleteState = false;
            return (
                <div className="link-item" key={item.secure_link_display_id}>
                                    <span className="link-item-top-level">
                                        <span className="title">
                                            { title || t('messages:recentLinksNoTitle.message') }
                                        </span>
                                        <CopyToClipboard text={item.secure_url} onCopy={() => this.copyLink(item)}>
                                             <span className="recent-links-btn"
                                                   id={'copy' + item.secure_link_display_id}>
                                                 { that.state.deleteState[item.secure_link_display_id] ? t('messages:recentLinksSure.message') : t('messages:recentLinksCopy.message') }
                                             </span>
                                        </CopyToClipboard>
                                    </span>
                    <span className="link-item-bottom-level">
                                        <span className="url">
                                            { item.secure_url.length >= 35 ? item.secure_url.substring(0, 35) + "..." : item.secure_url }
                                        </span>

                        { that.state.deleteState[item.secure_link_display_id] ?
                            (<div>
                                <span id='conf-yes' onClick={e => that.remove(item, type)}>{t('messages:recentLinksYes.message')} </span>
                                <span id='conf-no' onClick={e => that.deleteNo(item.secure_link_display_id)}>{t('messages:recentLinksNo.message')}</span>
                            </div>) :
                            (<span id={item.secure_link_display_id} onClick={e => that.tryDelete(item.secure_link_display_id)}>{t('messages:remove.message')}</span>)
                        }
                     </span>
                </div>
            )
        };
        return (
            <div className={ this.props.data.current.appIsOn ? "recent enabled" : "recent disabled"}>
                <div className="topNav">
                    <div className="top topSecondary">
                        <a id="menuBtn" onClick={this.goToMenu}> <img src={arrowLeftImgSrc}/><span>{t('messages:backTitle.message')}</span></a>
                        <span>{t('messages:recentLinksTitle.message')}</span>
                    </div>
                </div>
                {this.state.noLinks ? (<div className="noSlinks" id="noSlinks">
                    <div>{t('messages:recentLinksNoLinks.message')}</div>
                    <div className="noSlinksLink" id="noSlinksLink" onClick={this.onNoLinks}>
                        {t('messages:recentLinksLearn.message')}
                    </div>
                </div>) : null
                }
                <div id="recentLinks" className="recentLinks" >
                    {
                        _.isEmpty(this.state.todayList) ? null : (
                            <div className="links-header">
                                {t('messages:recentLinksToday.message')}
                            </div>
                        )
                    }
                    {
                        _.isEmpty(this.state.todayList) ? null : _.map(this.state.todayList, item => itemTemplate(item, 'todayList'))
                    }

                    {
                        _.isEmpty(this.state.lastWeekList) ? null : (
                            <div className="links-header">
                                {t('messages:recentLinksWeek.message')}
                            </div>
                        )
                    }
                    {
                        _.isEmpty(this.state.lastWeekList) ? null : _.map(this.state.lastWeekList, item => itemTemplate(item, 'lastWeekList'))
                    }

                    {
                        _.isEmpty(this.state.lastMonthList) ? null : (
                            <div className="links-header">
                                {t('messages:recentLinksMonth.message')}
                            </div>
                        )
                    }
                    {
                        _.isEmpty(this.state.lastMonthList) ? null : _.map(this.state.lastMonthList, item => itemTemplate(item, 'lastMonthList'))
                    }

                    {
                        _.isEmpty(this.state.olderList) ? null : (
                            <div className="links-header">
                                {t('messages:recentLinksOlder.message')}
                            </div>
                        )
                    }
                    {
                        _.isEmpty(this.state.olderList) ? null : _.map(this.state.olderList, item => itemTemplate(item, 'olderList'))
                    }
            </div>
            </div>
        )
    }
}

RecentLinks.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(RecentLinks);