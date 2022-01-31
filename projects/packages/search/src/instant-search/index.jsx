// NOTE: This must be imported first before any other imports.
// See: https://github.com/webpack/webpack/issues/2776#issuecomment-233208623
import './set-webpack-public-path';

/**
 * External dependencies
 * NOTE: We directly import preact here since we don't expect this file to be used in a React context.
 */
import React from 'preact/compat';
import { render } from 'preact';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
import { getThemeOptions } from './lib/dom';
import { SERVER_OBJECT_NAME } from './lib/constants';
import { buildFilterAggregations } from './lib/api';
import { isInCustomizer } from './lib/customize';
import store from './store';

const injectSearchApp = () => {
	render(
		<Provider store={ store }>
			<SearchApp
				aggregations={ buildFilterAggregations( [
					...window[ SERVER_OBJECT_NAME ].widgets,
					...window[ SERVER_OBJECT_NAME ].widgetsOutsideOverlay,
				] ) }
				enableAnalytics
				hasOverlayWidgets={ !! window[ SERVER_OBJECT_NAME ].hasOverlayWidgets }
				initialHref={ window.location.href }
				// NOTE: initialIsVisible is only used in the customizer. See lib/customize.js.
				initialIsVisible={ window[ SERVER_OBJECT_NAME ].showResults }
				isInCustomizer={ isInCustomizer() }
				overlayOptions={ window[ SERVER_OBJECT_NAME ].overlayOptions }
				options={ window[ SERVER_OBJECT_NAME ] }
				shouldCreatePortal
				shouldIntegrateWithDom
				themeOptions={ getThemeOptions( window[ SERVER_OBJECT_NAME ] ) }
			/>
		</Provider>,
		document.body
	);
};

/**
 * Main function.
 */
export function initialize() {
	if ( window[ SERVER_OBJECT_NAME ] && 'siteId' in window[ SERVER_OBJECT_NAME ] ) {
		injectSearchApp();
	}
}
