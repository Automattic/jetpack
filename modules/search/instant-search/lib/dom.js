export function removeChildren( htmlElement ) {
	while ( htmlElement.lastChild ) {
		htmlElement.removeChild( htmlElement.lastChild );
	}
}

export function hideSearchHeader() {
	const title = document.querySelector( '#content .page-title' );
	if ( title ) {
		title.style.display = 'none';
	}
}

export function getCheckedInputNames( parentDom ) {
	return [ ...parentDom.querySelectorAll( 'input[type="checkbox"]' ).values() ]
		.filter( input => input.checked )
		.map( input => input.name );
}
