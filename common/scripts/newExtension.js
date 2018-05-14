import React from 'react';
import { render } from 'react-dom';
import App from './components/app.js';
import Home from './components/home.js';
import Locations from './components/connection/location.js';
import SecureLink from './components/secureLink/secureLink.js';
import SignIn from './components/auth/signIn';
import Menu from './components/menu';
import RecentLinks from './components/recent-links';
import BlockingOptions from './components/blocking-options';
import WhiteList from './components/whiteList';
import ServiceScreen from './components/serviceScreen';
import Languages from './components/languages';
import { Router, Route, IndexRoute, hashHistory } from 'react-router'
import { I18nextProvider } from 'react-i18next';
import { changeClientHeight } from './components/helpers/'

// popup styles
// import cssRules from '../css/newStyle.css';

// Quick hotfix for secure.link not being updated
chrome.tabs.query({ active: true, currentWindow: true }, linkInfo => {
	// console.log(linkInfo[0].url)
	chrome.runtime.sendMessage(
		{ action: 'UPDATE_SECURE_LINK', link: linkInfo[0].url }
	)
})

import i18n from './i18n';

const app = (
	<I18nextProvider i18n={ i18n }>
		<Router history={hashHistory}>
			<Route path="/" component={App}>
				<Route path="/locations" component={Locations} />
				<Route path="/secure_link"  component={SecureLink} />
				<Route path="/menu" component={Menu} />
				<Route path="/recent-links" component={RecentLinks} />
				<Route
					path="/blocking-options"
					component={BlockingOptions}
					onEnter={() => changeClientHeight(520)}
					onLeave={() => changeClientHeight()}
				/>
				<Route path="/whitelist" component={WhiteList} />
				<Route path="/service" component={ServiceScreen} />
				<Route path="/home" component={Home} />
				<Route path="/languages" component={Languages} />
				<IndexRoute component={SignIn} />
			</Route>
		</Router>
	</I18nextProvider>
);

render( app, document.getElementById('content') );
