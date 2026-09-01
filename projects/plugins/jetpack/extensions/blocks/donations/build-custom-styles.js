/**
 * Build a CSS string scoping per-state and tab-level style rules to a single
 * block instance. Returns an empty string when no overrides are set.
 *
 * @param {object} attributes - Block attributes containing optional per-state colors and tab dimensions.
 * @param {string} scope      - A CSS class selector (with leading dot) unique to this instance.
 * @return {string} CSS string suitable for a <style> element, or empty if no rules.
 */
const ALLOWED_BUTTON_ALIGNMENTS = [ 'left', 'center', 'right', 'full' ];

// Read a uniform-or-split BorderBoxControl value into individual side declarations.
// Returns an array of CSS declaration strings for inclusion in a single rule.
const borderDecls = ( border, sidesPrefix = 'border' ) => {
	if ( ! border || typeof border !== 'object' ) {
		return [];
	}
	const decls = [];
	const sides = [ 'top', 'right', 'bottom', 'left' ];
	const isSplit = sides.some( s => border[ s ] );
	if ( isSplit ) {
		sides.forEach( side => {
			const sb = border[ side ];
			if ( ! sb ) return;
			if ( sb.color ) decls.push( `${ sidesPrefix }-${ side }-color:${ sb.color }` );
			if ( sb.style ) decls.push( `${ sidesPrefix }-${ side }-style:${ sb.style }` );
			if ( sb.width ) decls.push( `${ sidesPrefix }-${ side }-width:${ sb.width }` );
		} );
	} else {
		if ( border.color ) decls.push( `${ sidesPrefix }-color:${ border.color }` );
		if ( border.style ) decls.push( `${ sidesPrefix }-style:${ border.style }` );
		if ( border.width ) decls.push( `${ sidesPrefix }-width:${ border.width }` );
	}
	return decls;
};

// Read a uniform-or-per-corner BorderRadiusControl value into declarations.
const radiusDecls = radius => {
	if ( ! radius ) return [];
	if ( typeof radius === 'string' ) {
		return [ `border-radius:${ radius }` ];
	}
	if ( typeof radius === 'object' ) {
		const corners = {
			topLeft: 'border-top-left-radius',
			topRight: 'border-top-right-radius',
			bottomRight: 'border-bottom-right-radius',
			bottomLeft: 'border-bottom-left-radius',
		};
		return Object.entries( corners )
			.filter( ( [ key ] ) => radius[ key ] )
			.map( ( [ key, prop ] ) => `${ prop }:${ radius[ key ] }` );
	}
	return [];
};

const buildCustomStyles = ( attributes, scope ) => {
	const {
		activeTabBackgroundColor,
		activeTabTextColor,
		inactiveTabBackgroundColor,
		inactiveTabTextColor,
		selectedAmountBackgroundColor,
		selectedAmountTextColor,
		selectedAmountOutlineColor,
		tabBorderColor,
		tabFontSize,
		tabPadding,
		amountFontSize,
		amountBorder,
		amountBorderRadius,
		buttonFontSize,
		buttonPadding,
		buttonAlignment,
		buttonBorderRadius,
		contentAlignment,
		blockBorder,
		blockBorderRadius,
		displayMode,
	} = attributes;

	const rules = [];

	if ( [ 'left', 'center', 'right' ].includes( contentAlignment ) ) {
		rules.push( `${ scope } .donations__content{text-align:${ contentAlignment }}` );
		const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
		rules.push(
			`${ scope } .donations__amounts{justify-content:${ justifyMap[ contentAlignment ] }}`
		);
	}

	if ( tabBorderColor ) {
		rules.push(
			`${ scope } .donations__nav,${ scope } .donations__nav-item,${ scope } .donations__nav-item.is-active{border-color:${ tabBorderColor }}`
		);
	}

	if ( buttonBorderRadius ) {
		const decls = radiusDecls( buttonBorderRadius );
		if ( decls.length ) {
			rules.push( `${ scope } .donations__donate-button{${ decls.join( ';' ) }}` );
		}
	}

	const amountDecls = [];
	if ( amountFontSize ) {
		amountDecls.push( `font-size:${ amountFontSize }` );
	}
	amountDecls.push( ...borderDecls( amountBorder ) );
	amountDecls.push( ...radiusDecls( amountBorderRadius ) );
	if ( amountDecls.length ) {
		rules.push( `${ scope } .donations__amount{${ amountDecls.join( ';' ) }}` );
	}

	const tabDecls = [];
	if ( tabFontSize ) {
		tabDecls.push( `font-size:${ tabFontSize }` );
	}
	if ( tabPadding ) {
		[ 'top', 'right', 'bottom', 'left' ].forEach( side => {
			if ( tabPadding[ side ] ) {
				tabDecls.push( `padding-${ side }:${ tabPadding[ side ] }` );
			}
		} );
	}
	if ( tabDecls.length ) {
		rules.push( `${ scope } .donations__nav-item{${ tabDecls.join( ';' ) }}` );
	}

	const activeTabDecls = [];
	if ( activeTabBackgroundColor ) {
		activeTabDecls.push( `background:${ activeTabBackgroundColor }` );
	}
	if ( activeTabTextColor ) {
		activeTabDecls.push( `color:${ activeTabTextColor }` );
	}
	if ( activeTabDecls.length ) {
		rules.push( `${ scope } .donations__nav-item.is-active{${ activeTabDecls.join( ';' ) }}` );
	}

	const inactiveTabDecls = [];
	if ( inactiveTabBackgroundColor ) {
		inactiveTabDecls.push( `background:${ inactiveTabBackgroundColor }` );
	}
	if ( inactiveTabTextColor ) {
		inactiveTabDecls.push( `color:${ inactiveTabTextColor }` );
	}
	if ( inactiveTabDecls.length ) {
		rules.push(
			`${ scope } .donations__nav-item:not(.is-active){${ inactiveTabDecls.join( ';' ) }}`
		);
	}

	const selectedAmountDecls = [];
	if ( selectedAmountBackgroundColor ) {
		selectedAmountDecls.push( `background-color:${ selectedAmountBackgroundColor }` );
	}
	if ( selectedAmountTextColor ) {
		selectedAmountDecls.push( `color:${ selectedAmountTextColor }` );
	}
	// Override only the outer ring color; the inner 1px white separator stays put.
	if ( selectedAmountOutlineColor ) {
		selectedAmountDecls.push(
			`box-shadow:0 0 0 1px #fff,0 0 0 3px ${ selectedAmountOutlineColor }`
		);
	}
	if ( selectedAmountDecls.length ) {
		rules.push( `${ scope } .donations__amount.is-selected{${ selectedAmountDecls.join( ';' ) }}` );
	}

	const buttonDecls = [];
	if ( buttonFontSize ) {
		buttonDecls.push( `font-size:${ buttonFontSize }` );
	}
	if ( buttonPadding ) {
		[ 'top', 'right', 'bottom', 'left' ].forEach( side => {
			if ( buttonPadding[ side ] ) {
				buttonDecls.push( `padding-${ side }:${ buttonPadding[ side ] }` );
			}
		} );
	}
	if ( buttonDecls.length ) {
		rules.push( `${ scope } .donations__donate-button{${ buttonDecls.join( ';' ) }}` );
	}

	if ( ALLOWED_BUTTON_ALIGNMENTS.includes( buttonAlignment ) ) {
		if ( buttonAlignment === 'full' ) {
			rules.push(
				`${ scope } .donations__donate-button-wrapper{display:block;width:100%}` +
					`${ scope } .donations__donate-button{display:block;width:100%;box-sizing:border-box;text-align:center}`
			);
		} else {
			rules.push( `${ scope } .donations__donate-button-wrapper{text-align:${ buttonAlignment }}` );
		}
	}

	if ( displayMode !== 'modal' ) {
		const wrapperBorderDecls = [
			...borderDecls( blockBorder ),
			...radiusDecls( blockBorderRadius ),
		];
		if ( wrapperBorderDecls.length ) {
			rules.push( `.wp-block-jetpack-donations${ scope }{${ wrapperBorderDecls.join( ';' ) }}` );
		}
	}

	if ( displayMode === 'modal' && [ 'left', 'center', 'right' ].includes( contentAlignment ) ) {
		rules.push( `${ scope }{text-align:${ contentAlignment }}` );
	}

	return rules.join( '' );
};

export default buildCustomStyles;
