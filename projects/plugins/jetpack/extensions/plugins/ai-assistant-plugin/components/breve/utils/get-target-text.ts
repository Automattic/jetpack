/**
 * Internal dependencies
 */
import { getNodeTextIndex } from './get-node-text-index';
import { getNonLinkAncestor } from './get-non-link-ancestor';

export default function getTargetText( anchor: HTMLElement ) {
	const target = anchor?.innerText;
	const parent = getNonLinkAncestor( anchor as HTMLElement );
	// The text containing the target
	const text = parent?.innerText as string;
	// Get the index of the target in the parent
	const startIndex = getNodeTextIndex( parent as HTMLElement, anchor as HTMLElement );
	// Get the occurrences of the target in the sentence
	const targetRegex = new RegExp( target, 'gi' );
	const matches = Array.from( text.matchAll( targetRegex ) ).map( match => match.index );
	// Get the right occurrence of the target in the sentence
	const occurrence = Math.max( 1, matches.indexOf( startIndex ) + 1 );

	return { target, parent, text, occurrence };
}
