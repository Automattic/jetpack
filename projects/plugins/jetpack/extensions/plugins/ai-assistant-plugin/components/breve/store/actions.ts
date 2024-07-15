/**
 * External dependencies
 */
import { askQuestionSync } from '@automattic/jetpack-ai-client';
import { select } from '@wordpress/data';
import { getRequestMessages } from '../utils/getRequestMessages';

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
	sentence,
	blockId,
}: {
	id: string;
	feature: string;
	sentence: string;
	blockId: string;
} ) {
	return ( { dispatch } ) => {
		dispatch( {
			type: 'SET_SUGGESTIONS_LOADING',
			id,
			feature,
			loading: true,
		} );

		askQuestionSync(
			getRequestMessages( {
				feature,
				sentence,
				blockId,
			} ),
			{
				feature: 'jetpack-ai-breve',
			}
		)
			.then( response => {
				// eslint-disable-next-line no-console
				try {
					const suggestions = JSON.parse( response );
					dispatch( {
						type: 'SET_SUGGESTIONS',
						id,
						feature,
						suggestions,
					} );
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( e );
					dispatch( {
						type: 'SET_SUGGESTIONS_LOADING',
						id,
						feature,
						loading: false,
					} );
				}
			} )
			.catch( () => {
				dispatch( {
					type: 'SET_SUGGESTIONS_LOADING',
					id,
					feature,
					loading: false,
				} );
			} );
	};
}
