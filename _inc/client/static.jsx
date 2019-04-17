/**
 * External dependencies
 */
import Server from 'react-dom/server';
import React from 'react';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import StaticMain from 'static-main';
import StaticWarning from 'components/jetpack-notices/static-warning';

window.staticHtml = Server.renderToStaticMarkup(
	<div>
		<Provider store={ store }>
			<StaticMain />
		</Provider>
	</div>
);

window.noscriptNotice = Server.renderToStaticMarkup(
	<Provider store={ store }>
		<noscript>
			<StaticWarning />
		</noscript>
	</Provider>
);

window.versionNotice = Server.renderToStaticMarkup(
	<Provider store={ store }>
		<StaticWarning />
	</Provider>
);
