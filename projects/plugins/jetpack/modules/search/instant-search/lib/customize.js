/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from './constants';

const SETTINGS_TO_STATE_MAP = new Map( [
	[ 'jetpack_search_color_theme', 'colorTheme' ],
	[ 'jetpack_search_enable_sort', 'enableSort' ],
	[ 'jetpack_search_highlight_color', 'highlightColor' ],
	[ 'jetpack_search_inf_scroll', 'enableInfScroll' ],
	[ 'jetpack_search_opacity', 'opacity' ],
	[ 'jetpack_search_overlay_trigger', 'overlayTrigger' ],
	[ 'jetpack_search_show_powered_by', 'showPoweredBy' ],
	[ 'jetpack_search_result_format', 'resultFormat' ],
] );

export function isInCustomizer() {
	return Boolean(
		'undefined' !== typeof window.wp &&
			window.wp.customize &&
			window.wp.customize.settings &&
			window.wp.customize.settings.url &&
			window.wp.customize.settings.url.self
	);
}

export function bindCustomizerChanges( callback ) {
	if ( ! isInCustomizer() ) {
		return;
	}

	SETTINGS_TO_STATE_MAP.forEach( ( jsName, phpName ) => {
		window.wp.customize( phpName, value => {
			value.bind( function ( newValue ) {
				const newOvelayOptions = { [ jsName ]: newValue };

				// If Instant Search hasn't been injected, update initial server object state
				window[ SERVER_OBJECT_NAME ].showResults = true;
				window[ SERVER_OBJECT_NAME ].overlayOptions = {
					...window[ SERVER_OBJECT_NAME ].overlayOptions,
					...newOvelayOptions,
				};

				// If callback is available, invoke it.
				callback && callback( newOvelayOptions );
			} );
		} );
	} );
}
