import apiFetch from '@wordpress/api-fetch';
import { API_PATH, VALID_SECTIONS } from '../constants';

/**
 * Generate or improve guidelines for the given sections/blocks.
 *
 * Translates between the internal format used by our components and the
 * API's categories-based format:
 *
 * API request:  { categories: { site: {}, copy: { guidelines: "..." }, blocks: { "core/paragraph": {} } } }
 * API response: { site: { guidelines: "..." }, blocks: { "core/paragraph": { guidelines: "..." } } }
 *
 * @param {string[]}                slugs             - Section slugs or block names to generate.
 * @param {Object.<string, string>} [existingContent] - Existing content keyed by slug.
 * @return {Promise<Object>} Response with `suggestions` keyed by slug.
 */
export async function suggestGuidelines( slugs, existingContent = {} ) {
	// Build categories object for the API.
	// Standard sections go as top-level keys, block names go under `blocks`.
	const categories = {};
	const blockEntries = {};

	for ( const slug of slugs ) {
		const existing = existingContent[ slug ];
		const entry = existing ? { guidelines: existing } : {};

		if ( VALID_SECTIONS.includes( slug ) ) {
			categories[ slug ] = entry;
		} else {
			blockEntries[ slug ] = entry;
		}
	}

	if ( Object.keys( blockEntries ).length > 0 ) {
		categories.blocks = blockEntries;
	}

	const response = await apiFetch( {
		path: API_PATH,
		method: 'POST',
		data: { categories },
	} );

	// Normalize API response to { suggestions: { slug: text } }.
	const suggestions = {};
	for ( const slug of slugs ) {
		if ( VALID_SECTIONS.includes( slug ) ) {
			const guidelines = response?.[ slug ]?.guidelines;
			if ( guidelines ) {
				suggestions[ slug ] = guidelines;
			}
		} else {
			const guidelines = response?.blocks?.[ slug ]?.guidelines;
			if ( guidelines ) {
				suggestions[ slug ] = guidelines;
			}
		}
	}

	return { suggestions };
}
