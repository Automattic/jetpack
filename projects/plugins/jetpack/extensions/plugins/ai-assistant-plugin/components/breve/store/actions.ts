/**
 * External dependencies
 */
import { askQuestionSync } from '@automattic/jetpack-ai-client';
import { select } from '@wordpress/data';
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

export function setSuggestions( {
	id,
	feature,
	target,
	sentence,
	blockId,
	occurrence,
}: {
	id: string;
	feature: string;
	target: string;
	sentence: string;
	blockId: string;
	occurrence: string;
} ) {
	return ( { dispatch } ) => {
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
				sentence,
				blockId,
				occurrence,
			} ),
			{
				feature: 'jetpack-ai-breve',
			}
		)
			.then( response => {
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
