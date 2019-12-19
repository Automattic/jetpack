export function removeChildren( htmlElement ) {
	while ( htmlElement && htmlElement.lastChild ) {
		htmlElement.removeChild( htmlElement.lastChild );
	}
}

export function hideElements( elementSelectors ) {
	let elem = null;
	for ( let i = 0; i < elementSelectors.length; i++ ) {
		elem = document.querySelector( elementSelectors[ i ] );
		if ( elem ) {
			elem.style.display = 'none';
		}
	}
}

export function hideChildren( elem_selector ) {
	const elem = document.querySelector( elem_selector );
	for ( let i = 0; i < elem.children.length; i++ ) {
		elem.children[ i ].style.display = 'none';
	}
}

export function showChildren( elem_selector ) {
	const elem = document.querySelector( elem_selector );
	for ( let i = 0; i < elem.children.length; i++ ) {
		elem.children[ i ].style.display = 'initial';
	}
}

export function getCheckedInputNames( parentDom ) {
	return [ ...parentDom.querySelectorAll( 'input[type="checkbox"]' ).values() ]
		.filter( input => input.checked )
		.map( input => input.name );
}

function findResultSelector() {
	// The order here matters
	const resultSelectors = [
		//2015, 2016, 2017, 2019, argent, astra, storefront
		'main',
		//2010, 2011, 2012, 2013, 2014
		'#content',
		//colormag, shapely, sydney, zerif lite
		'#primary',
		//hemingway
		'.content',
	];
	// Sample the dom to try and find a location to mount results
	for ( let i = 0; i < resultSelectors.length; i++ ) {
		if ( document.querySelector( resultSelectors[ i ] ) ) {
			return resultSelectors[ i ];
		}
	}
	return null;
}

function findElementsToRemove() {
	const potentialRemovals = [
		'#content .page-title',
		'section.ast-archive-description',
		//'input.search-submit', ???
	];
	return potentialRemovals.filter( selector => document.querySelector( selector ) );
}

export function getThemeOptions( searchOptions ) {
	const options = {
		resultsSelector: findResultSelector(),
		elementSelectors: findElementsToRemove(),
		searchFormSelector: 'form#searchform, form.search-form, form.searchform',
	};
	return searchOptions.theme_options ? { ...options, ...searchOptions.theme_options } : options;
}
