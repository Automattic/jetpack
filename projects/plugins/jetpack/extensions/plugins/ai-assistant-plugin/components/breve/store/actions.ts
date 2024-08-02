/**
 * External dependencies
 */
import { askQuestionSync } from '@automattic/jetpack-ai-client';
import { select } from '@wordpress/data';
import { BREVE_FEATURE_NAME } from '../constants';
import { getRequestMessages } from '../utils/get-request-messages';

// ACTIONS

export function setHighlightHover( isHover: boolean ) {
	return {
		type: 'SET_HIGHLIGHT_HOVER',
		isHover,
	};
}

export function setPopoverHover( isHover: boolean ) {
	return {
		type: 'SET_POPOVER_HOVER',
		isHover,
	};
}

export function setPopoverAnchor( anchor: HTMLElement | EventTarget ) {
	return {
		type: 'SET_POPOVER_ANCHOR',
		anchor,
	};
}

export function toggleProofread( force?: boolean ) {
	const current = select( 'jetpack/ai-breve' ).isProofreadEnabled();
	const enabled = force === undefined ? ! current : force;

	return {
		type: 'SET_PROOFREAD_ENABLED',
		enabled,
	};
}

export function toggleFeature( feature: string, force?: boolean ) {
	const current = select( 'jetpack/ai-breve' ).isFeatureEnabled( feature );
	const enabled = force === undefined ? ! current : force;

	return {
		type: enabled ? 'ENABLE_FEATURE' : 'DISABLE_FEATURE',
		feature,
	};
}

export function setBlockMd5( blockId: string, md5: string ) {
	return {
		type: 'SET_BLOCK_MD5',
		blockId,
		md5,
	};
}

export function invalidateSuggestions( blockId: string ) {
	return {
		type: 'INVALIDATE_SUGGESTIONS',
		blockId,
	};
}

export function ignoreSuggestion( blockId: string, id: string ) {
	return {
		type: 'IGNORE_SUGGESTION',
		blockId,
		id,
	};
}

export function setSuggestions( {
	anchor,
	id,
	feature,
	target,
	text,
	blockId,
	occurrence,
}: {
	anchor: HTMLElement;
	id: string;
	feature: string;
	target: string;
	text: string;
	blockId: string;
	occurrence: string;
} ) {
	return ( { dispatch } ) => {
		anchor?.classList?.add( 'is-loading' );

		dispatch( {
			type: 'SET_SUGGESTIONS_LOADING',
			id,
			feature,
			blockId,
			loading: true,
		} );

		askQuestionSync(
			getRequestMessages( {
				feature,
				target,
				text,
				blockId,
				occurrence,
			} ),
			{
				feature: BREVE_FEATURE_NAME,
			}
		)
			.then( response => {
				anchor?.classList?.remove( 'is-loading' );

				try {
					const suggestions = JSON.parse( response );
					dispatch( {
						type: 'SET_SUGGESTIONS',
						id,
						feature,
						suggestions,
						blockId,
					} );
				} catch ( e ) {
					dispatch( {
						type: 'SET_SUGGESTIONS_LOADING',
						id,
						feature,
						blockId,
						loading: false,
					} );
				}
			} )
			.catch( () => {
				anchor?.classList?.remove( 'is-loading' );

				dispatch( {
					type: 'SET_SUGGESTIONS_LOADING',
					id,
					feature,
					blockId,
					loading: false,
				} );
			} );
	};
}
