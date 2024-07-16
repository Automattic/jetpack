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
import type { BreveDispatch, Anchor } from '../types';

let highlightTimeout: number;
let anchorTimeout: number;

function handleMouseEnter( e: React.MouseEvent ) {
	clearTimeout( highlightTimeout );
	clearTimeout( anchorTimeout );

	anchorTimeout = setTimeout( () => {
		const el = e.target as HTMLElement;
		let virtual = el;

		const shouldPointToCursor = el.getAttribute( 'data-type' ) === 'long-sentences';

		if ( shouldPointToCursor ) {
			const rect = el.getBoundingClientRect();
			const diff = e.clientY - Math.floor( rect.top );
			const offset = diff === 0 ? 10 : 0;

			virtual = {
				getBoundingClientRect() {
					return {
						top: e.clientY + offset,
						left: e.clientX,
						bottom: e.clientY,
						right: e.clientX,
						width: 0,
						height: 0,
						x: e.clientX,
						y: e.clientY,
					} as DOMRect;
				},
				contextElement: e.target as HTMLElement,
			} as unknown as HTMLElement;
		}

		( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setHighlightHover( true );
		( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setPopoverAnchor( {
			target: e.target as HTMLElement,
			virtual: virtual,
		} as Anchor );
	}, 100 );
}

function handleMouseLeave() {
	highlightTimeout = setTimeout( () => {
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
				highlightEl?.removeEventListener?.( 'mouseover', handleMouseEnter );
				highlightEl?.addEventListener?.( 'mouseover', handleMouseEnter );
				highlightEl?.removeEventListener?.( 'mouseleave', handleMouseLeave );
				highlightEl?.addEventListener?.( 'mouseleave', handleMouseLeave );
			} );
		}
	} );
}
