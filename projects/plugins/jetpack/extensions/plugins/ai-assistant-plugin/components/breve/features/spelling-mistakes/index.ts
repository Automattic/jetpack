/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import nspell from 'nspell';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText, SpellChecker } from '../../types';

export const SPELLING_MISTAKES: BreveFeatureConfig = {
	name: 'spelling-mistakes',
	title: __( 'Spelling mistakes', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--spelling-mistakes',
	defaultEnabled: false,
};

const spellcheckers: { [ key: string ]: SpellChecker } = {};
const spellingContexts: {
	[ key: string ]: {
		affix: string;
		dictionary: string;
	};
} = {};

const loadContext = ( language: string ) => {
	// TODO: Load dictionaries dynamically and save on localStorage
	return spellingContexts[ language ];
};

const getSpellchecker = ( { language = 'en' }: { language?: string } = {} ) => {
	if ( spellcheckers[ language ] ) {
		return spellcheckers[ language ];
	}

	// Cannot await here as the Rich Text function needs to be synchronous.
	// Load of the dictionary in the background if necessary and re-trigger the highlights later.
	const spellingContext = loadContext( language );

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
