/**
 * Build a CSS string scoping per-state color rules to a single block instance.
 * Returns an empty string when no overrides are set.
 *
 * @param {object} attributes - Block attributes containing optional per-state colors.
 * @param {string} scope      - A CSS class selector (with leading dot) unique to this instance.
 * @return {string} CSS string suitable for a <style> element, or empty if no rules.
 */
const buildCustomStyles = ( attributes, scope ) => {
	const {
		activeTabBackgroundColor,
		activeTabTextColor,
		inactiveTabBackgroundColor,
		inactiveTabTextColor,
		selectedAmountBackgroundColor,
		selectedAmountTextColor,
	} = attributes;

	const rules = [];

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

	return rules.join( '' );
};

export default buildCustomStyles;
