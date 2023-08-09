export function fixIncompleteHTML( html: string ): string {
	const div = document.createElement( 'div' );
	div.innerHTML = html;
	return div.innerHTML;
}
