/**
 * Generates a letter-based label for image option fields.
 * Converts position to letters: 1=A, 2=B, ..., 26=Z, 27=AA, 28=AB, etc.
 *
 * @param {number} position - The 1-based position of the image option.
 * @return {string} The letter-based label (A, B, C, ..., Z, AA, AB, ...).
 */
export const getImageOptionLetter = ( position: number ): string => {
	if ( position < 1 ) return '';

	let result = '';

	while ( position > 0 ) {
		position--;
		result = String.fromCharCode( 65 + ( position % 26 ) ) + result;
		position = Math.floor( position / 26 );
	}

	return result;
};
