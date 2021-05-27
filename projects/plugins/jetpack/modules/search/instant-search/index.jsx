/** @jsx h */

// NOTE: This must be imported first before any other imports.
// See: https://github.com/webpack/webpack/issues/2776#issuecomment-233208623
import './set-webpack-public-path';

/**
 * External dependencies
 */
import { h, render } from 'preact';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
import { getThemeOptions } from './lib/dom';
import { SERVER_OBJECT_NAME } from './lib/constants';
import { initializeTracks, identifySite, resetTrackingCookies } from './lib/tracks';
import { buildFilterAggregations } from './lib/api';
import store from './store';

const injectSearchApp = () => {
	render(
		<Provider store={ store }>
			<SearchApp
				aggregations={ buildFilterAggregations( [
					...window[ SERVER_OBJECT_NAME ].widgets,
					...window[ SERVER_OBJECT_NAME ].widgetsOutsideOverlay,
				] ) }
				defaultSort={ window[ SERVER_OBJECT_NAME ].defaultSort }
				hasOverlayWidgets={ !! window[ SERVER_OBJECT_NAME ].hasOverlayWidgets }
				initialHref={ window.location.href }
				initialOverlayOptions={ window[ SERVER_OBJECT_NAME ].overlayOptions }
				// NOTE: initialShowResults is only used in the customizer. See lib/customize.js.
				initialShowResults={ window[ SERVER_OBJECT_NAME ].showResults }
				options={ window[ SERVER_OBJECT_NAME ] }
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
		initializeTracks();
		resetTrackingCookies();
		identifySite( window[ SERVER_OBJECT_NAME ].siteId );
		injectSearchApp();
	}
}
