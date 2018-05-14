import React from 'react';
import _ from 'underscore';

export default class BlockingItem extends React.Component {
    _bind(...methods) {
        _.each(methods, method => (this[method] = this[method].bind(this)));
    }

    constructor(props) {
        super(props);
        this._bind('changeItemState', 'refreshing');
        this.state = {
            firstItem: props.firstItem,
            buttonState: props.buttonState,
            title: props.title,
            lastItem: props.lastItem,
            refresh: '',
            onChangeEvent: props.onChangeEvent,
            note: props.note,
            appIsOn: props.appIsOn
        };
    }

    changeItemState(e) {
        e.preventDefault();
        this.setState({
            buttonState: !this.state.buttonState
        });

        chrome.runtime.sendMessage({ action: this.state.onChangeEvent, data: !this.state.buttonState });
    }

    refreshing(e) {
        e.preventDefault();
        this.setState({
            refresh: '-middle'
        });
        const that = this;
        setTimeout(() => that.setState({ refresh: '-end' }), 500);
        setTimeout(() => that.setState({ refresh: '' }), 2500);

        chrome.runtime.sendMessage({ action: 'ROTATE_USER_AGENT' });
    }

    render() {
        const { t } = this.props;
        return (
            <div className={'options-item ' + this.state.firstItem}>
                <div className="child left-block">
                    <div>{this.state.title}</div>
                    <div className="options-note">{this.state.note}</div>
                </div>
                <div className="child right-block">
                    {this.state.lastItem ? (
                        <span className={'onoffswitch-refresh' + this.state.refresh} onClick={this.refreshing}>
                            <span className="icon" />
                        </span>
                    ) : null}
                    <div onClick={this.changeItemState.bind(this)} className="onoffswitch">
                        <label
                            className='onoffswitch-label'
                            style={{
                                backgroundColor: this.state.appIsOn && this.state.buttonState && '#80a7e0'
                            }}
                        >
                            <span
                                className={
                                    (this.state.buttonState ? 'off ' : 'on ') +
                                    (this.state.appIsOn && this.state.buttonState ? 'offEnabled ' : ' ')
                                }
                            >
                                <span className="circle" />
                                <span className="text">
                                    {this.state.buttonState ? t('messages:privacyOptionsOn.message') : t('messages:privacyOptionsOff.message')}
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        );
    }
}
