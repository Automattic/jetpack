export function formatDateString( dateString ) {
	try {
		const date = new Date( dateString );
		return date.toLocaleDateString();
	} catch ( error ) {
		return dateString;
	}
}
