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
