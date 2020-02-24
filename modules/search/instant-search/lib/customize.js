const CUSTOMIZE_SETTINGS = [
	'jetpack_search_color_theme',
	'jetpack_search_inf_scroll',
	'jetpack_search_highlight_color',
	'jetpack_search_opacity',
	'jetpack_search_show_powered_by',
];

const SETTINGS_TO_STATE_MAP = new Map( [
	[ 'jetpack_search_color_theme', 'colorTheme' ],
	[ 'jetpack_search_inf_scroll', 'enableInfScroll' ],
	[ 'jetpack_search_highlight_color', 'highlightColor' ],
	[ 'jetpack_search_opacity', 'opacity' ],
	[ 'jetpack_search_show_powered_by', 'showPoweredBy' ],
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

	CUSTOMIZE_SETTINGS.forEach( setting => {
		window.wp.customize( setting, value => {
			value.bind( function( newValue ) {
				callback( {
					key: SETTINGS_TO_STATE_MAP.get( setting ),
					value: newValue,
				} );
			} );
		} );
	} );
}
