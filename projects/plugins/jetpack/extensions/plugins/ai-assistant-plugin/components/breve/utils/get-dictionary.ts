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
 * @return {Promise<SpellingDictionaryContext>} - A promise that resolves a dictionary context object.
 */
export default async function getDictionary(
	type: string,
	language: string
): Promise< SpellingDictionaryContext > {
	debug( 'Asking dictionary for type: %s. language: %s', type, language );

	// Randomize the server to balance the load
	const counter = Math.floor( Math.random() * 3 );
	const url = `https://s${ counter }.wp.com/wp-content/lib/jetpack-ai/breve-dictionaries/${ type }/${ language }.json`;

	try {
		const data = await fetch( url );

		if ( data.status === 404 ) {
			throw new Error( 'The requested dictionary does not exist' );
		} else if ( data.status !== 200 ) {
			throw new Error( 'Failed to fetch dictionary' );
		}

		return data.json();
	} catch ( error ) {
		debug( 'Error getting dictionary: %o', error );
		return Promise.reject( error );
	}
}
