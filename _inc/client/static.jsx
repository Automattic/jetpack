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

export const html = Server.renderToStaticMarkup(
	<div>
		<Provider store={ store }>
			  <StaticMain />
		</Provider>

	</div>
);
