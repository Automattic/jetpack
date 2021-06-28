export function getCheckedInputNames( parentDom ) {
	return [ ...parentDom.querySelectorAll( 'input[type="checkbox"]' ).values() ]
		.filter( input => input.checked )
		.map( input => input.name );
}

export function getThemeOptions( searchOptions ) {
	const options = {
		searchInputSelector: [
			'input[name="s"]:not(.jetpack-instant-search__box-input)',
			'#searchform input.search-field:not(.jetpack-instant-search__box-input)',
			'.search-form input.search-field:not(.jetpack-instant-search__box-input)',
			'.searchform input.search-field:not(.jetpack-instant-search__box-input)',
		].join( ', ' ),
		filterInputSelector: [ 'a.jetpack-search-filter__link' ],
		overlayTriggerSelector: [
			'.jetpack-instant-search__open-overlay-button',
			'header#site-header .search-toggle[data-toggle-target]', // TwentyTwenty theme's search button
		].join( ',' ),
	};
	return searchOptions.theme_options ? { ...options, ...searchOptions.theme_options } : options;
}

/**
 * Remove HTML elements from a string.
 *
 * @param {string} input - String potentially containing HTML
 * @returns {string} - String without HTML
 */
export function stripHTML( input ) {
	const doc = new DOMParser().parseFromString( input, 'text/html' );
	return doc?.body?.textContent || '';
}
