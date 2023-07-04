/**
 * Returns a string truncated to a given length.
 * If truncated, the string will end with an ellipsis.
 *
 * @param {string} str       string to truncate
 * @param {number} maxLength maximum length of the string
 */
export function truncateString( str: string, maxLength?: number ): string {
	if ( ! maxLength ) {
		maxLength = 20;
	}

	return str.length > maxLength ? str.slice( 0, maxLength ) + '…' : str;
}
