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
import StaticWarning from 'components/jetpack-notices/static-warning';

export default () =>
	renderToStaticMarkup(
		<Provider store={ store }>
			<noscript>
				<StaticWarning />
			</noscript>
		</Provider>
	);
