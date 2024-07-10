/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import phrases from './phrases';

export const COMPLEX_WORDS = {
	name: 'complex-words',
	title: 'Jetpack AI Proofread Complex Words',
	tagName: 'span',
	className: 'has-proofread-highlight',
};

export default function complexWords( text ) {
	const list = new RegExp(
		`\\b(${ Object.keys( phrases ).map( escapeRegExp ).join( '|' ) })\\b`,
		'gi'
	);

	const matches = text.matchAll( list );
	const words = [];

	for ( const match of matches ) {
		const word = match[ 0 ].trim();
		words.push( {
			word,
			suggestion: phrases[ word ],
			startIndex: match.index,
			endIndex: match.index + word.length,
		} );
	}

	return words;
}
