/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import getContainer from './container';
import features from './index';

let timeout;

function handleMouseEnter( e ) {
	e.stopPropagation();
	clearTimeout( timeout );
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	( dispatch( 'jetpack/ai-breve' ) as any ).setHighlightHover( true );
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	( dispatch( 'jetpack/ai-breve' ) as any ).setPopoverAnchor( e.target );
}

function handleMouseLeave( e ) {
	e.stopPropagation();
	timeout = setTimeout( () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		( dispatch( 'jetpack/ai-breve' ) as any ).setHighlightHover( false );
	}, 100 );
}

export default function registerEvents( clientId: string ) {
	const { foundContainer: container } = getContainer();
	const id = `block-${ clientId }`;
	const block = container?.querySelector?.( `#${ id }` );

	features.forEach( ( { config } ) => {
		const items = block?.querySelectorAll?.( `[data-type='${ config.name }']` );
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
