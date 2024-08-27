/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import nspell from 'nspell';
/**
 * Internal dependencies
 */
import getDictionary from '../../utils/get-dictionary';
import a8c from './a8c';
/**
 * Types
 */
import type {
	BreveFeatureConfig,
	SpellingDictionaryContext,
	HighlightedText,
	SpellChecker,
	BreveDispatch,
} from '../../types';

const debug = debugFactory( 'jetpack-ai-breve:spelling-mistakes' );

export const SPELLING_MISTAKES: BreveFeatureConfig = {
	name: 'spelling-mistakes',
	title: __( 'Spelling mistakes', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--spelling-mistakes',
	defaultEnabled: false,
};

const spellCheckers: { [ key: string ]: SpellChecker } = {};
const contextRequests: {
	[ key: string ]: { loading: boolean; loaded: boolean; failed: boolean };
} = {};

const fetchContext = async ( language: string ) => {
	debug( 'Fetching spelling context from the server' );

	const { setDictionaryLoading } = dispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	setDictionaryLoading( SPELLING_MISTAKES.name, true );

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
		debug( 'Failed to fetch spelling context', error );
		contextRequests[ language ] = { loading: false, loaded: false, failed: true };
		// TODO: Handle retries
	} finally {
		setDictionaryLoading( SPELLING_MISTAKES.name, false );
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

export const getSpellChecker = ( { language = 'en' }: { language?: string } = {} ) => {
	if ( spellCheckers[ language ] ) {
		return spellCheckers[ language ];
	}

	// Cannot await here as the Rich Text function needs to be synchronous.
	// Load of the dictionary in the background if necessary and re-trigger the highlights later.
	const spellingContext = getContext( language );

	if ( ! spellingContext ) {
		return null;
	}

	const { affix, dictionary } = spellingContext;
	const spellChecker = nspell( affix, dictionary ) as unknown as SpellChecker;

	// Get the exceptions from the local storage
	const exceptions: string[] = Array.from(
		new Set(
			JSON.parse(
				localStorage.getItem( `jetpack-ai-breve-spelling-exceptions-${ language }` ) as string
			) || []
		)
	);
	exceptions.forEach( exception => spellChecker.add( exception ) );

	// Add the Automattic dictionary
	spellChecker.personal( a8c );

	spellCheckers[ language ] = spellChecker;

	return spellCheckers[ language ];
};

export const addTextToDictionary = (
	text: string,
	{ language = 'en' }: { language?: string } = {}
) => {
	const spellChecker = getSpellChecker( { language } );
	const { reloadDictionary } = dispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	if ( ! spellChecker ) {
		return;
	}

	try {
		// Save the new exception to the local storage
		const current = new Set(
			JSON.parse(
				localStorage.getItem( `jetpack-ai-breve-spelling-exceptions-${ language }` ) as string
			) || []
		);

		current.add( text );

		localStorage.setItem(
			`jetpack-ai-breve-spelling-exceptions-${ language }`,
			JSON.stringify( Array.from( current ) )
		);
	} catch ( error ) {
		debug( 'Failed to add text to the dictionary', error );
		return;
	}

	// Recompute the spell checker on the next call
	delete spellCheckers[ language ];

	reloadDictionary();

	debug( 'Added text to the dictionary', text );
};

export const suggestSpellingFixes = (
	text: string,
	{ language = 'en' }: { language?: string } = {}
) => {
	const spellChecker = getSpellChecker( { language } );

	if ( ! spellChecker || ! text ) {
		return [];
	}

	// capital_P_dangit
	if ( text.toLocaleLowerCase() === 'wordpress' ) {
		return [ 'WordPress' ];
	}

	const suggestions = spellChecker.suggest( text );

	return suggestions;
};

export default function spellingMistakes( text: string ): Array< HighlightedText > {
	const highlightedTexts: Array< HighlightedText > = [];
	// Regex to match words, including contractions and hyphenated words, possibly prefixed with special characters
	// \p{L} is a Unicode property that matches any letter in any language
	// \p{M} is a Unicode property that matches any character intended to be combined with another character
	const wordRegex = new RegExp( /[@#+$]{0,1}[\p{L}\p{M}'-]+/, 'gu' );
	const words = ( text.match( wordRegex ) || [] )
		// Filter out words that start with special characters
		.filter( word => [ '@', '#', '+', '$' ].indexOf( word[ 0 ] ) === -1 )
		// Split hyphenated words into separate words as nspell doesn't work well with them
		.map( word => word.split( '-' ) )
		.flat();
	const spellChecker = getSpellChecker();

	if ( ! spellChecker ) {
		return highlightedTexts;
	}

	// To avoid highlighting the same word occurrence multiple times
	let searchStartIndex = 0;

	words.forEach( ( word: string ) => {
		const wordIndex = text.indexOf( word, searchStartIndex );

		if ( ! spellChecker.correct( word ) ) {
			highlightedTexts.push( {
				text: word,
				startIndex: wordIndex,
				endIndex: wordIndex + word.length,
			} );
		}

		searchStartIndex = wordIndex + word.length;
	} );

	return highlightedTexts;
}
