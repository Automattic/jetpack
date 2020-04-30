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
		searchSortSelector: [ '.jetpack-search-sort' ],
		filterInputSelector: [ 'a.jetpack-search-filter__link' ],
	};
	return searchOptions.theme_options ? { ...options, ...searchOptions.theme_options } : options;
}
