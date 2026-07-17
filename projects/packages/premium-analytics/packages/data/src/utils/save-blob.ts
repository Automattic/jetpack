/**
 * Save a blob as a browser download.
 *
 * @param blob     - Blob to download.
 * @param filename - Requested download filename.
 * @return The sanitized filename used for the download.
 */
export function saveBlob( blob: Blob, filename: string ): string {
	const url = window.URL.createObjectURL( blob );
	const link = document.createElement( 'a' );
	// Replace path separators, control characters, and Windows-reserved characters.
	// Fall back to a generic name so an empty (or fully-stripped) input cannot
	// produce a hidden `.csv` dotfile.
	// eslint-disable-next-line no-control-regex
	const safeName = filename.replace( /[\x00-\x1f/\\:*?"<>|]/g, '-' ).trim() || 'export';
	const csvFilename = safeName.toLowerCase().endsWith( '.csv' ) ? safeName : `${ safeName }.csv`;

	link.href = url;
	link.download = csvFilename;

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
	setTimeout( () => window.URL.revokeObjectURL( url ), 0 );

	return csvFilename;
}
