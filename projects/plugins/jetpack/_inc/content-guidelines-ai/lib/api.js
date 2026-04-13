import apiFetch from '@wordpress/api-fetch';
import { API_PATH, VALID_SECTIONS } from '../constants';

const MOCK = true; // HACK: flip to false to use real API

const MOCK_SUGGESTIONS = {
	site: 'A modern WordPress site sharing tutorials and best practices for web development. The audience includes developers, designers, and content creators.',
	copy: 'Write in a clear, conversational tone with active voice and short paragraphs. Address the reader directly with "you" and "your".',
	images:
		'Use high-quality screenshots at 2x resolution with descriptive alt text. Prefer PNG for UI captures and WebP for photographs.',
	additional:
		'Include code examples with syntax highlighting and link to official documentation. Update posts when APIs change.',
};

const MOCK_BLOCK_SUGGESTION =
	'Use this block to present clear, well-structured content. Keep text concise and focused on a single idea per block. Avoid overly long blocks — break content into smaller, scannable sections when possible.';

function delay( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

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
	if ( MOCK ) {
		await delay( 3000 );
		return {
			suggestions: Object.fromEntries(
				slugs.map( slug => [ slug, MOCK_SUGGESTIONS[ slug ] || MOCK_BLOCK_SUGGESTION ] )
			),
		};
	}
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
