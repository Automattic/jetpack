/**
 * Fetches the names of all checkbox elements contained within the parent element.
 *
 * @param {Element} parentDom - Parent element containing one or more checkboxes.
 * @returns {string[]} - Names of checkboxes.
 */
export function getCheckedInputNames( parentDom ) {
	return [ ...parentDom.querySelectorAll( 'input[type="checkbox"]' ).values() ]
		.filter( input => input.checked )
		.map( input => input.name );
}

/**
 * Returns an object containing theme options. Values can be overridden using the optional input parameter.
 *
 * @param {object} searchOptions - Search options.
 * @returns {object} - Search options.
 */
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
