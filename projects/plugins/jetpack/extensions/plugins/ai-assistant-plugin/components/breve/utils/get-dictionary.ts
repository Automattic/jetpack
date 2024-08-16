/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Types
 */
import { SpellingDictionaryContext } from '../types';

const debug = debugFactory( 'jetpack-ai-breve:get-dictionary' );

/**
 * A function that gets a Breve dictionary context object.
 *
 * @param {string} type
 * @param {string} language
 * @returns {Promise<SpellingDictionaryContext>} - A promise that resolves a dictionary context object.
 */
export default async function getDictionary(
	type: string,
	language: string
): Promise< SpellingDictionaryContext > {
	debug( 'Asking dictionary for type: %s. language: %s', type, language );

	const url = new URL( 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-breve-dictionaries' );
	const params = new URLSearchParams( { type, language } ).toString();
	url.search = params;

	try {
		const data = await fetch( url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		} ).then( response => response.json() );

		return JSON.parse( data );
	} catch ( error ) {
		debug( 'Error getting dictionary: %o', error );
		return Promise.reject( error );
	}
}
