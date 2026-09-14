// NOTE: This must be imported first before any other imports.
// See: https://github.com/webpack/webpack/issues/2776#issuecomment-233208623
import './set-webpack-public-path';

// NOTE: We directly import preact here since we don't expect this file to be used in a React context.
import { render } from 'preact';
import * as React from 'preact/compat';
import { Provider } from 'react-redux';
import SearchApp from './components/search-app';
import { buildFilterAggregations } from './lib/api';
import { SERVER_OBJECT_NAME } from './lib/constants';
import { isInCustomizer } from './lib/customize';
import { getThemeOptions } from './lib/dom';
import { normalizeWidgets } from './lib/widgets';
import store from './store';

const injectSearchApp = () => {
	const serverObject = window[ SERVER_OBJECT_NAME ];
	const widgets = normalizeWidgets( serverObject.widgets );
	const widgetsOutsideOverlay = normalizeWidgets( serverObject.widgetsOutsideOverlay );

	render(
		<Provider store={ store }>
			<SearchApp
				aggregations={ buildFilterAggregations( [ ...widgets, ...widgetsOutsideOverlay ] ) }
				enableAnalytics={ ! serverObject.disableTracking }
				hasOverlayWidgets={ !! serverObject.hasOverlayWidgets }
				initialHref={ window.location.href }
				// NOTE: initialIsVisible is only used in the customizer. See lib/customize.js.
				initialIsVisible={ serverObject.showResults }
				isInCustomizer={ isInCustomizer() }
				overlayOptions={ serverObject.overlayOptions }
				options={ { ...serverObject, widgets, widgetsOutsideOverlay } }
				shouldCreatePortal
				shouldIntegrateWithDom
				themeOptions={ getThemeOptions( serverObject ) }
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
