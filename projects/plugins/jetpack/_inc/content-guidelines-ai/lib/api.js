import apiFetch from '@wordpress/api-fetch';
import { API_PATH } from '../constants';

const MOCK = true; // ← flip to false to use real API

const MOCK_SUGGESTIONS = {
	site: 'This is a modern WordPress site focused on sharing in-depth tutorials, step-by-step guides, and best practices for web development and design. The primary audience includes developers, designers, and content creators who want to build beautiful, performant, and accessible websites.',
	copy: 'Write in a clear, conversational tone that balances technical accuracy with approachability. Use active voice and short paragraphs. Avoid jargon unless defining it first. Address the reader directly with "you" and "your".',
	images:
		'Use high-quality screenshots at 2x resolution. Prefer light mode for UI captures. Add descriptive alt text. Use PNG for UI screenshots, WebP for photographs. Keep file sizes under 200KB where possible.',
	additional:
		'Always include code examples with syntax highlighting. Link to official documentation. Update posts when APIs change. Include a "Prerequisites" section for tutorial content.',
};

function delay( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

/**
 * Generate or improve guidelines for the given sections.
 *
 * Translates between the internal format used by our components and the
 * API's categories-based format:
 *
 * API request:  { categories: { site: {}, copy: { guidelines: "..." } } }
 * API response: { site: { guidelines: "..." }, copy: { guidelines: "..." } }
 *
 * @param {string[]}                sections          - Sections to generate.
 * @param {Object.<string, string>} [existingContent] - Existing content keyed by section slug.
 * @return {Promise<Object>} Response with `suggestions` keyed by section slug.
 */
export async function suggestGuidelines( sections, existingContent = {} ) {
	if ( MOCK ) {
		await delay( 3000 );
		return {
			suggestions: Object.fromEntries(
				sections.map( slug => [
					slug,
					MOCK_SUGGESTIONS[ slug ] ||
						'Use this block to present clear, well-structured content. Keep text concise and focused on a single idea per block. Avoid overly long blocks — break content into smaller, scannable sections when possible.',
				] )
			),
		};
	}

	// Build categories object for the API.
	const categories = {};
	for ( const slug of sections ) {
		const existing = existingContent[ slug ];
		categories[ slug ] = existing ? { guidelines: existing } : {};
	}

	const response = await apiFetch( {
		path: API_PATH,
		method: 'POST',
		data: { categories },
	} );

	// Normalize API response to { suggestions: { slug: text } }.
	const suggestions = {};
	for ( const slug of sections ) {
		const guidelines = response?.[ slug ]?.guidelines;
		if ( guidelines ) {
			suggestions[ slug ] = guidelines;
		}
	}

	return { suggestions };
}
