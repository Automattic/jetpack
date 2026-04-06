import apiFetch from '@wordpress/api-fetch';
import { API_PATH } from '../constants';

/**
 * Generate or improve guidelines for the given sections.
 *
 * @param {string[]}                sections          - Sections to generate.
 * @param {Object.<string, string>} [existingContent] - Existing content keyed by section slug.
 * @return {Promise<Object>} Response with `suggestions` keyed by section slug.
 */
export async function suggestGuidelines( sections, existingContent = {} ) {
	const data = { sections };

	const filtered = Object.fromEntries(
		Object.entries( existingContent ).filter( ( [ , v ] ) => v )
	);
	if ( Object.keys( filtered ).length > 0 ) {
		data.existing_content = filtered;
	}

	return apiFetch( {
		path: API_PATH,
		method: 'POST',
		data,
	} );
}
