import React from 'react'
import PropTypes from 'prop-types';
const SIGN_IN = "SIGN_IN";
import { translate } from 'react-i18next';
import Spinner from './Spinner';

class SignIn extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            login: '',
            password: '',
            error: '',
            showSpinner: false,
            loggingout: this.props.location.query.loggingout
        };
        this.loginSubmit = this.loginSubmit.bind(this);
        this.signUp = this.signUp.bind(this);
        this.onChange = this.onChange.bind(this);
        this.forgotPasswd = this.forgotPasswd.bind(this);
    }

    componentWillMount() {
        if (this.state.loggingout) {
            this.setState({showSpinner: true})
            return;
        };
        this.props.data.session_auth_hash && this.props.data.current.country.short_name && this.context.router.push('/home');
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.data.current.loggingOut && this.state.loggingout) {
            this.setState({loggingout: false, showSpinner: false});
        }
        if (this.state.loggingout) return;

        nextProps.data.session_auth_hash && nextProps.data.current.country.short_name && this.context.router.push('/home');
        nextProps.data.errors.loginError && this.setState({showSpinner: false, error: 'login'});
    }

    componentDidMount() {
        this.props.data.errors.loginError && chrome.runtime.sendMessage({
            action: "SET_LOGIN_ERROR",
            data: false
        });
    }

    loginSubmit(event) {
        event.preventDefault();
        if (this.state.login && this.state.password) {
            chrome.runtime.sendMessage({
                action: "SIGN_IN",
                data: {
                    username: this.state.login,
                    password: this.state.password
                }
            });

            this.setState({showSpinner: true})
        } else {
            this.setState({error: 'emptyInput'})
        }
    }

    signUp(e) {
        e.preventDefault();
        chrome.tabs.create({url: this.props.data.rootUrl + 'signup?ws_ext'});
    }

    onChange(property, event) {
        const newState = {error: '', emptyInput: !this.state.login || !this.state.password};
        newState[property] = event.target.value;
        this.setState(newState);

        if (this.props.data.errors.loginError) {
            chrome.runtime.sendMessage({
                action: "SET_LOGIN_ERROR",
                data: false
            });
        }
    }

    forgotPasswd(e) {
        e.preventDefault();
        chrome.tabs.create({url: this.props.data.rootUrl + 'forgotpassword'});
    }

    render() {
        const { t } = this.props;
        const logoImgSrc = require(`../../../assets/logo@2x.png`);
        let errMsg;
        switch (this.state.error) {
            case 'login':
                errMsg = t('messages:loginErr.message');
                break;
            case 'emptyInput':
                errMsg = t('messages:loginEmptyInput.message');
                break;
            default:
                errMsg = '';
                break;
        }

        const signIn = (
            <div className="sign">
                <div className="topmenu">
                    <img src={logoImgSrc} width="90"/>
                    <a onClick={this.signUp}>{t('messages:loginSignUp.message')}</a>
                </div>
                <form className="auth">
                    <div>
                        <span>{t('messages:loginTitle.message')}</span>
                            <span className="auth-error">
                                {errMsg}
                            </span>
                    </div>
                    <input
                        type="text"
                        value={this.state.login}
                        placeholder={t('messages:loginUsernamePlaceholder.message')}
                        onChange={(e) => this.onChange('login', e)}
                    />
                    <input
                        type="password"
                        value={this.state.password}
                        placeholder={t('messages:loginPasswordPlaceholder.message')}
                        onChange={(e) => this.onChange('password', e)}
                    />
                    <button onClick={this.loginSubmit}>{t('messages:loginButtonText.message')}</button>
                    <a onClick={this.forgotPasswd}>{t('messages:loginForgotPassword.message')}?</a>
                </form>
                <div className="blue-rect"></div>
            </div>
        );
        const spinnerMessage = this.state.loggingout ? `` : `${t('messages:loginWelcomeMsg.message')}!`;

        return (
            <div>
                { this.state.showSpinner ? <Spinner message={spinnerMessage}/> : signIn }
            </div>
        )
    }
}

SignIn.contextTypes = {
    router: PropTypes.object.isRequired
};

export default translate(['messages'], {wait: true})(SignIn);