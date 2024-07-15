/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import getContainer from './container';
import features from './index';
/**
 * Types
 */
import type { BreveDispatch, BreveSelect } from '../types';

let highlightTimeout: number;

function handleMouseEnter( e: React.MouseEvent ) {
	e.stopPropagation();
	clearTimeout( highlightTimeout );
	( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).increasePopoverLevel();
	( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setHighlightHover( true );
	( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setPopoverAnchor( e.target );
}

function handleMouseLeave( e: React.MouseEvent ) {
	e.stopPropagation();
	( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).decreasePopoverLevel();

	highlightTimeout = setTimeout( () => {
		// If the mouse is still over any highlight, don't hide the popover
		const { getPopoverLevel } = select( 'jetpack/ai-breve' ) as BreveSelect;
		if ( getPopoverLevel() > 0 ) {
			return;
		}

		( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setHighlightHover( false );
	}, 50 );
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
