/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import getContainer from '../container';
import phrases from './phrases';

export const COMPLEX_WORDS = {
	name: 'complex-words',
	title: 'Jetpack AI Proofread Complex Words',
	tagName: 'span',
	className: 'has-proofread-highlight',
};

function handleMouseEnter( e ) {
	e.stopPropagation();
	e.target.setAttribute( 'data-ai-breve-anchor', true );
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	( dispatch( 'jetpack/ai-breve' ) as any ).setPopoverState( true );
}

function handleMouseLeave( e ) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	( dispatch( 'jetpack/ai-breve' ) as any ).setPopoverState( false );
	e.stopPropagation();
	e.target.removeAttribute( 'data-ai-breve-anchor' );
}

export function registerComplexWordsEvents() {
	const { foundContainer: container } = getContainer();
	const items = container?.querySelectorAll?.( "[data-type='complex-words']" );

	items.forEach( highlightEl => {
		highlightEl?.removeEventListener?.( 'mouseenter', handleMouseEnter );
		highlightEl?.addEventListener?.( 'mouseenter', handleMouseEnter );
		highlightEl?.removeEventListener?.( 'mouseleave', handleMouseLeave );
		highlightEl?.addEventListener?.( 'mouseleave', handleMouseLeave );
	} );
}

export default function complexWords( text ) {
	const list = new RegExp(
		`(${ Object.keys( phrases ).map( escapeRegExp ).join( '|' ) })\\b`,
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
