export function removeChildren( htmlElement ) {
	while ( htmlElement.lastChild ) {
		htmlElement.removeChild( htmlElement.lastChild );
	}
}

export function hideElements( elem_selectors ) {
	let elem = null;
	for ( let i = 0; i < elem_selectors.length; i++ ) {
		elem = document.querySelector( elem_selectors[ i ] );
		if ( elem ) {
			elem.style.display = 'none';
		}
	}
}

export function getCheckedInputNames( parentDom ) {
	return [ ...parentDom.querySelectorAll( 'input[type="checkbox"]' ).values() ]
		.filter( input => input.checked )
		.map( input => input.name );
}

export function getThemeOptions( searchOptions ) {
	//the order here matters
	const result_selectors = [
		//2015, 2016, 2017, 2019, argent, astra, storefront
		'main',
		//2010, 2011, 2012, 2013, 2014
		'#content',
		//colormag, shapely, sydney, zerif lite
		'#primary',
		//hemingway
		'.content',
	];

	const potential_removals = [
		'#content .page-title',
		'section.ast-archive-description',
		//'input.search-submit', ???
	];

	let options = {
		results_selector: null,
		elem_selectors: [],
		search_form_selector: 'form#searchform, form.search-form, form.searchform',
	};

	//sample the dom to try and find a location to mount results
	for ( let i = 0; i < result_selectors.length; i++ ) {
		if ( document.querySelector( result_selectors[ i ] ) ) {
			options.results_selector = result_selectors[ i ];
			break;
		}
	}

	//look for elements we should remove
	for ( let i = 0; i < potential_removals.length; i++ ) {
		if ( document.querySelector( potential_removals[ i ] ) ) {
			options.elem_selectors.push( potential_removals[ i ] );
		}
	}

	if ( searchOptions.theme_options ) {
		//apply overrides from user filters
		options = { ...options, ...searchOptions.theme_options };
	}

	return options;
}
