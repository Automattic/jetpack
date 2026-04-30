/**
 * Build a CSS string scoping per-state and tab-level style rules to a single
 * block instance. Returns an empty string when no overrides are set.
 *
 * @param {object} attributes - Block attributes containing optional per-state colors and tab dimensions.
 * @param {string} scope      - A CSS class selector (with leading dot) unique to this instance.
 * @return {string} CSS string suitable for a <style> element, or empty if no rules.
 */
const ALLOWED_BUTTON_ALIGNMENTS = [ 'left', 'center', 'right', 'full' ];

const buildCustomStyles = ( attributes, scope ) => {
	const {
		activeTabBackgroundColor,
		activeTabTextColor,
		inactiveTabBackgroundColor,
		inactiveTabTextColor,
		selectedAmountBackgroundColor,
		selectedAmountTextColor,
		tabFontSize,
		tabPadding,
		buttonFontSize,
		buttonPadding,
		buttonAlignment,
	} = attributes;

	const rules = [];

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
					`${ scope } .donations__donate-button{display:block;width:100%;box-sizing:border-box}`
			);
		} else {
			rules.push( `${ scope } .donations__donate-button-wrapper{text-align:${ buttonAlignment }}` );
		}
	}

	return rules.join( '' );
};

export default buildCustomStyles;
