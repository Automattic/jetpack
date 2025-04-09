import md5 from 'crypto-js/md5';

export function getAnchorIdFromText( {
	text,
	startIndex,
	endIndex,
	blockId,
}: {
	text?: string;
	startIndex?: number;
	endIndex?: number;
	blockId?: string;
} ) {
	if ( text && Number.isInteger( startIndex ) && Number.isInteger( endIndex ) && blockId ) {
		return md5( `${ text }-${ startIndex }-${ endIndex }-${ blockId }` ).toString();
	}

	return null;
}

export function getAnchorIdFromElement( element: HTMLElement ) {
	return element?.getAttribute( 'data-id' );
}
