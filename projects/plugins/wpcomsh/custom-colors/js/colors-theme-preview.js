/* global ColorsTool, Color, wp */
/**
 * Listen to your heart. Or postMessage, I forget.
 * @param {object}    $     - the jQuery object.
 * @param {undefined} undef - the undefined object.
 */
( function ( $, undef ) {
	// store 'em
	// for adding/removing body class
	const body = $( 'body' );
	let _setColors = {},
		// holding container for style element
		colorsStyle = false;

	wp.customize( 'colors_manager[colors]', function ( value ) {
		value.bind( applyColors );
	} );

	/**
	 * Sets up the style element for embedding the CSS.
	 */
	function primeColorsStyleElement() {
		if ( colorsStyle !== false && colorsStyle.length ) {
			return;
		}

		// Remove an existing one
		$( '#custom-colors-css' ).remove();
		colorsStyle = $( '<style id="custom-colors-css" />' );

		// first, see if we have a custom css element - we want to be before it
		if ( $( '#custom-css-css' ).length ) {
			colorsStyle.insertBefore( '#custom-css-css' );
		} else {
			// no custom css. append to head.
			colorsStyle.appendTo( 'head' );
		}
	}

	/**
	 * Applies the colors passed in the arguments.
	 *
	 * @param {object} colors - the Colors object.
	 */
	function applyColors( colors ) {
		let css;
		primeColorsStyleElement();
		// store 'em = _setColors is defined one step up
		_setColors = colors;

		// bail early if we have default colors
		if ( isDefaultColors( colors ) ) {
			colorsStyle.remove();
			colorsStyle = false;
			body.removeClass( 'custom-colors' );
			return;
		}

		body.addClass( 'custom-colors' );

		// extra CSS - always on
		css = ColorsTool.extraCss;

		// extra colors - need processing.
		$.each( ColorsTool.extraColors, function ( i, extra ) {
			if ( extra.rules === undef ) {
				return;
			}
			$.each( extra.rules, function ( j, rule ) {
				css += cssRule( rule, extra.color );
			} );
		} );

		// user colors
		$.each( ColorsTool.colors, function ( i, val ) {
			const color = colors[ i ];
			// sanity check
			if ( color === undef ) {
				return;
			}
			$.each( val, function ( j, value ) {
				css += cssRule( value, color );
			} );
		} );

		// new CSS
		colorsStyle.text( css );
	}

	/**
	 * This makes a CSS rule.
	 *
	 * @param {Array}  rule  - the rule description: [selector, prop, opacity(optional)]
	 * @param {string} color - the assigned color.
	 * @return {string} CSS
	 */
	function cssRule( rule, color ) {
		let css = '',
			workingColor,
			modType,
			modifier,
			bgColor,
			contrast,
			firstChar;

		if ( rule[ 2 ] !== undef ) {
			workingColor = new Color( color );
			modType = typeof rule[ 2 ];
			modifier = parseFloat( rule[ 2 ] );

			// ensure contrast or darken/lighten
			if ( modType === 'string' ) {
				firstChar = rule[ 2 ].substring( 0, 1 );
				// darken/lighten
				if ( '+' === firstChar || '-' === firstChar ) {
					modifier *= 10;
					workingColor.l( workingColor.l() + modifier );
					color = workingColor.toString();
				}
				// hex bg for contrast
				else if ( '#' === firstChar ) {
					bgColor = new Color( rule[ 2 ] );
				}
				// set color bg for contrast
				else if ( _setColors[ rule[ 2 ] ] !== undef ) {
					bgColor = new Color( _setColors[ rule[ 2 ] ] );
				}
				// we have one
				if ( bgColor instanceof Color ) {
					// default contrast of 5, can be overridden with 4th arg.
					contrast = rule[ 3 ] === undef ? 5 : rule[ 3 ];
					color = workingColor.getReadableContrastingColor( bgColor, contrast ).toString();
				}
			}
			// rgba with fallbacks
			else if ( modType === 'number' ) {
				// non-rgba browsers
				css += cssRule( [ rule[ 0 ], rule[ 1 ] ], color );
				// now rgba
				color = workingColor.toCSS( 'rgba', modifier );
			}
		}
		css += rule[ 0 ] + ' {' + rule[ 1 ] + ': ' + color + ';}\n';
		return css;
	}

	/**
	 * Simplistic object comparer.
	 *
	 * @param {object} colors - color object.
	 * @return {boolean} isDefault
	 */
	function isDefaultColors( colors ) {
		let key;
		const defaults = ColorsTool.defaultColors;

		for ( key in defaults ) {
			if (
				colors[ key ] === undef ||
				defaults[ key ].toLowerCase() !== colors[ key ].toLowerCase()
			) {
				return false;
			}
		}
		return true;
	}
} )( jQuery );
