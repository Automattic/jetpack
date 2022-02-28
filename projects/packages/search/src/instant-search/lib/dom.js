/**
 * External dependencies
 */
import memoize from 'timed-memoize';

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
		searchInputSelector: [ 'input[name="s"]', 'input.search-field', 'input.wp-block-search__input' ]
			.map( s => s + ':not(.jetpack-instant-search__box-input)' )
			.join( ', ' ),
		filterInputSelector: [ 'a.jetpack-search-filter__link' ],
		overlayTriggerSelector: [
			'.jetpack-instant-search__open-overlay-button',
			'header#site-header .search-toggle[data-toggle-target]', // TwentyTwenty theme's search button
		].join( ',' ),
	};
	return searchOptions?.theme_options ? { ...options, ...searchOptions.theme_options } : options;
}

/**
 * Returns an array of search inputs that should be listened to for spawning the overlay.
 *
 * This function is memoized with a timed expiry to avoid repeatedly querying the document and
 * to ensure it can handle input addition or deletion.
 *
 * @param {any} args - Same format as getThemeOptions.
 * @returns {Array<Node>} - Search inputs.
 */
export const getSearchInputs = memoize(
	function ( ...args ) {
		const { searchInputSelector } = getThemeOptions( ...args );

		// Filter out various search inputs that may not be related to searching the site.
		return [ ...document.querySelectorAll( searchInputSelector ) ].filter( input => {
			// Exclude GeoDirectory plugin forms
			if ( input.form?.name?.toLowerCase() === 'geodir-listing-search' ) {
				return false;
			}

			// Exclude POST forms, which are typically not used for search form inputs.
			if ( input.form?.method?.toLowerCase() === 'post' ) {
				return false;
			}

			return true;
		} );
	},
	{ timeout: 1000 }
);
