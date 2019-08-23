export function removeChildren( htmlElement ) {
	while ( htmlElement.lastChild ) {
		htmlElement.removeChild( htmlElement.lastChild );
	}
}
