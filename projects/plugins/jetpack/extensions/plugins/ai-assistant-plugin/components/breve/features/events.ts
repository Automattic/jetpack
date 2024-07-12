/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import getContainer from './container';
import features from './index';
/**
 * Types
 */
import type { BreveDispatch } from '../types';

let timeout: number;

function handleMouseEnter( e: React.MouseEvent ) {
	e.stopPropagation();
	clearTimeout( timeout );
	( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setHighlightHover( true );
	( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setPopoverAnchor( e.target );
}

function handleMouseLeave( e: React.MouseEvent ) {
	e.stopPropagation();
	timeout = setTimeout( () => {
		( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setHighlightHover( false );
	}, 100 );
}

export default function registerEvents( clientId: string ) {
	const { foundContainer: container } = getContainer();
	const id = `block-${ clientId }`;
	const block = container?.querySelector?.( `#${ id }` );

	features.forEach( ( { config } ) => {
		const items = block?.querySelectorAll?.( `[data-type='${ config.name }']` ) || [];

		if ( items?.length > 0 ) {
			items.forEach( highlightEl => {
				highlightEl?.removeEventListener?.( 'mouseenter', handleMouseEnter );
				highlightEl?.addEventListener?.( 'mouseenter', handleMouseEnter );
				highlightEl?.removeEventListener?.( 'mouseleave', handleMouseLeave );
				highlightEl?.addEventListener?.( 'mouseleave', handleMouseLeave );
			} );
		}
	} );
}
