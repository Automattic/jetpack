/**
 * External dependencies
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import StaticMain from 'static-main';
import StaticWarning from 'components/jetpack-notices/static-warning';

window.staticHtml = renderToStaticMarkup(
	<div>
		<Provider store={ store }>
			<StaticMain />
		</Provider>
	</div>
);

window.noscriptNotice = renderToStaticMarkup(
	<Provider store={ store }>
		<noscript>
			<StaticWarning />
		</noscript>
	</Provider>
);

window.versionNotice = renderToStaticMarkup(
	<Provider store={ store }>
		<StaticWarning />
	</Provider>
);
