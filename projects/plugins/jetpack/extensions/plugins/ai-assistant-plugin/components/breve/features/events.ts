/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { showAiAssistantSection } from '../utils/show-ai-assistant-section';
import getContainer from './container';
import { LONG_SENTENCES } from './long-sentences';
import features from './index';
/**
 * Types
 */
import type { BreveDispatch, Anchor, BreveSelect } from '../types';

let highlightTimeout: number;
let anchorTimeout: number;

let isFirstHover = ! localStorage.getItem( 'jetpack-ai-breve-first-hover' );

function getHighlightEl( el: HTMLElement | null ) {
	if ( el === document.body || el === null ) {
		return null;
	}

	const breveType = el.getAttribute( 'data-breve-type' );
	const featureTypes: Array< string | null > = features.map( ( { config } ) => config.name );

	if ( ! featureTypes.includes( breveType ) ) {
		return getHighlightEl( el.parentElement );
	}

	return el;
}

async function handleMouseEnter( e: MouseEvent ) {
	if ( isFirstHover ) {
		await showAiAssistantSection();

		isFirstHover = false;
		localStorage.setItem( 'jetpack-ai-breve-first-hover', 'false' );

		const isSmall = window.innerWidth < 600;

		// Do not show popover on small screens on first hover, as the sidebar will open
		if ( isSmall ) {
			return;
		}
	}

	clearTimeout( highlightTimeout );
	clearTimeout( anchorTimeout );

	const breveSelect = select( 'jetpack/ai-breve' ) as BreveSelect;

	anchorTimeout = setTimeout( () => {
		const isPopoverHover = breveSelect.isPopoverHover();

		if ( isPopoverHover ) {
			return;
		}

		const el = getHighlightEl( e.target as HTMLElement );

		if ( ! el ) {
			return;
		}

		let virtual = el;
		const shouldPointToCursor = el.getAttribute( 'data-breve-type' ) === LONG_SENTENCES.name;

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
			target: el,
			virtual: virtual,
		} as Anchor );
	}, 500 );
}

function handleMouseLeave() {
	clearTimeout( highlightTimeout );
	clearTimeout( anchorTimeout );

	highlightTimeout = setTimeout( () => {
		( dispatch( 'jetpack/ai-breve' ) as BreveDispatch ).setHighlightHover( false );
	}, 100 );
}

export default function registerEvents( clientId: string ) {
	const { foundContainer: container } = getContainer();
	const id = `block-${ clientId }`;
	const block = container?.querySelector?.( `#${ id }` );

	features.forEach( ( { config } ) => {
		const items: NodeListOf< HTMLElement > | undefined = block?.querySelectorAll?.(
			`[data-breve-type='${ config.name }']`
		);

		if ( items && items?.length > 0 ) {
			items.forEach( highlightEl => {
				highlightEl?.removeEventListener?.( 'mouseover', handleMouseEnter );
				highlightEl?.addEventListener?.( 'mouseover', handleMouseEnter );
				highlightEl?.removeEventListener?.( 'mouseleave', handleMouseLeave );
				highlightEl?.addEventListener?.( 'mouseleave', handleMouseLeave );
			} );
		}
	} );
}
