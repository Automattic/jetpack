/**
 * Display the corrected query notice after a search title.
 *
 * Builds the notice with DOM APIs so the original query is never parsed as HTML.
 * Passing escaped HTML through wp_localize_script() (which html_entity_decodes)
 * and then insertAdjacentHTML() was a reflected XSS vector.
 *
 * @param {object} [config] - Localized config; defaults to window.JetpackSearchCorrectedQuery.
 * @return {void}
 */
export function displayCorrectedQuery( config = window.JetpackSearchCorrectedQuery ) {
	if ( ! config?.message || ! Array.isArray( config.selectors ) || ! config.selectors.length ) {
		return;
	}

	const titleElement = document.querySelector( config.selectors.join( ', ' ) );
	if ( ! titleElement ) {
		return;
	}

	const notice = document.createElement( 'p' );
	notice.className = 'jetpack-search-corrected-query';
	notice.textContent = config.message;
	titleElement.insertAdjacentElement( 'afterend', notice );
}

document.addEventListener( 'DOMContentLoaded', () => {
	displayCorrectedQuery();
} );
