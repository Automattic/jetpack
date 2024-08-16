/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import nspell from 'nspell';
/**
 * Internal dependencies
 */
import getDictionary from '../../utils/get-dictionary';
/**
 * Types
 */
import type {
	BreveFeatureConfig,
	SpellingDictionaryContext,
	HighlightedText,
	SpellChecker,
} from '../../types';

const debug = debugFactory( 'jetpack-ai-breve:spelling-mistakes' );

export const SPELLING_MISTAKES: BreveFeatureConfig = {
	name: 'spelling-mistakes',
	title: __( 'Spelling mistakes', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--spelling-mistakes',
	defaultEnabled: false,
};

const spellcheckers: { [ key: string ]: SpellChecker } = {};
const contextRequests: {
	[ key: string ]: { loading: boolean; loaded: boolean; failed: boolean };
} = {};

const fetchContext = async ( language: string ) => {
	debug( 'Fetching spelling context from the server' );

	try {
		contextRequests[ language ] = { loading: true, loaded: false, failed: false };
		const data = await getDictionary( SPELLING_MISTAKES.name, language );

		localStorage.setItem(
			`jetpack-ai-breve-spelling-context-${ language }`,
			JSON.stringify( data )
		);

		contextRequests[ language ] = { loading: false, loaded: true, failed: false };
		debug( 'Loaded spelling context from the server' );
	} catch ( error ) {
		debug( 'Failed to fetch spelling context' );
		contextRequests[ language ] = { loading: false, loaded: false, failed: true };
		// TODO: Handle retries
	}
};

const getContext = ( language: string ) => {
	// First check if the context is already defined in local storage
	const storedContext = localStorage.getItem( `jetpack-ai-breve-spelling-context-${ language }` );
	let context: SpellingDictionaryContext | null = null;
	const { loading, failed } = contextRequests[ language ] || {};

	if ( storedContext ) {
		context = JSON.parse( storedContext );
		debug( 'Loaded spelling context from local storage' );
	} else if ( ! loading && ! failed ) {
		// If the context is not in local storage and we haven't failed to fetch it before, try to fetch it once
		fetchContext( language );
	}

	return context;
};

const getSpellchecker = ( { language = 'en' }: { language?: string } = {} ) => {
	if ( spellcheckers[ language ] ) {
		return spellcheckers[ language ];
	}

	// Cannot await here as the Rich Text function needs to be synchronous.
	// Load of the dictionary in the background if necessary and re-trigger the highlights later.
	const spellingContext = getContext( language );

	if ( ! spellingContext ) {
		return null;
	}

	const { affix, dictionary } = spellingContext;
	spellcheckers[ language ] = nspell( affix, dictionary );

	return spellcheckers[ language ];
};

export default function longSentences( text: string ): Array< HighlightedText > {
	const highlightedTexts: Array< HighlightedText > = [];
	// Regex to match words, including contractions and hyphenated words
	// \p{L} is a Unicode property that matches any letter in any language
	// \p{M} is a Unicode property that matches any character intended to be combined with another character
	const wordRegex = new RegExp( /[\p{L}\p{M}'-]+/, 'gu' );
	const words = text.match( wordRegex ) || [];
	const spellchecker = getSpellchecker();

	if ( ! spellchecker ) {
		return highlightedTexts;
	}

	words.forEach( ( word: string, index ) => {
		if ( ! spellchecker.correct( word ) ) {
			const suggestions = spellchecker.suggest( word );

			if ( suggestions.length > 0 ) {
				highlightedTexts.push( {
					text: word,
					startIndex: text.indexOf( word, index ),
					endIndex: text.indexOf( word, index ) + word.length,
					suggestions,
				} );
			}
		}
	} );

	return highlightedTexts;
}
