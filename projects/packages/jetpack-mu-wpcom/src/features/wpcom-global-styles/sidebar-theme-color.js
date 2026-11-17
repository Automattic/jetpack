// Used when the sidebar's own background can't be read; matches the default admin color scheme.
const DEFAULT_SIDEBAR_BACKGROUND = '#1e1e1e';

/**
 * Converts a computed CSS color to the opaque hex seed `ThemeProvider` requires.
 *
 * @param {string} value - A `#rgb`, `#rrggbb`, `rgb()` or `rgba()` color.
 * @return {string|null} The hex color, or null if the value isn't an opaque color.
 */
export function toOpaqueHex( value ) {
	const color = value?.trim() ?? '';

	const hex = color.match( /^#([0-9a-f]{3}|[0-9a-f]{6})$/i );
	if ( hex ) {
		const digits = hex[ 1 ].length === 3 ? hex[ 1 ].replace( /./g, '$&$&' ) : hex[ 1 ];
		return `#${ digits.toLowerCase() }`;
	}

	const rgb = color.match(
		/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)$/i
	);
	if ( ! rgb ) {
		return null;
	}

	const alpha = rgb[ 4 ] === undefined ? 1 : parseFloat( rgb[ 4 ] ) / ( rgb[ 5 ] ? 100 : 1 );
	if ( alpha !== 1 ) {
		return null;
	}

	return `#${ rgb
		.slice( 1, 4 )
		.map( channel => Math.min( 255, Number( channel ) ).toString( 16 ).padStart( 2, '0' ) )
		.join( '' ) }`;
}

/**
 * Reads the colors the sidebar around `element` renders with, so the notice follows the admin color scheme.
 *
 * @param {Element} element - An element inside the site editor sidebar.
 * @return {{background: string, primary?: string}} Seeds for `ThemeProvider`.
 */
export function getSidebarThemeColor( element ) {
	let background = null;
	for ( let node = element; node && ! background; node = node.parentElement ) {
		background = toOpaqueHex( window.getComputedStyle( node ).backgroundColor );
	}

	const primary = toOpaqueHex(
		window.getComputedStyle( element ).getPropertyValue( '--wp-admin-theme-color' )
	);

	return {
		background: background ?? DEFAULT_SIDEBAR_BACKGROUND,
		...( primary && { primary } ),
	};
}
