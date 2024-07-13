/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Types
 */
import type { BreveState } from '../types';

const enabledFromLocalStorage = window.localStorage.getItem( 'jetpack-ai-proofread-enabled' );
const disabledFeaturesFromLocalStorage = window.localStorage.getItem(
	'jetpack-ai-proofread-disabled-features'
);
const initialConfiguration = {
	enabled: enabledFromLocalStorage === 'true' || enabledFromLocalStorage === null,
	disabled:
		disabledFeaturesFromLocalStorage !== null ? JSON.parse( disabledFeaturesFromLocalStorage ) : [],
};

export function configuration(
	state: BreveState[ 'configuration' ] = initialConfiguration,
	action: { type: string; enabled?: boolean; feature?: string }
) {
	switch ( action.type ) {
		case 'SET_PROOFREAD_ENABLED': {
			const enabled = action?.enabled !== undefined ? action?.enabled : ! state?.enabled;
			window.localStorage.setItem( 'jetpack-ai-proofread-enabled', String( enabled ) );

			return {
				...state,
				enabled,
			};
		}

		case 'ENABLE_FEATURE': {
			const disabled = ( state.disabled ?? [] ).filter( feature => feature !== action.feature );
			window.localStorage.setItem(
				'jetpack-ai-proofread-disabled-features',
				JSON.stringify( disabled )
			);

			return {
				...state,
				disabled,
			};
		}

		case 'DISABLE_FEATURE': {
			const disabled = [ ...( state.disabled ?? [] ), action.feature ];
			window.localStorage.setItem(
				'jetpack-ai-proofread-disabled-features',
				JSON.stringify( disabled )
			);

			return {
				...state,
				disabled,
			};
		}
	}

	return state;
}

export function popover(
	state: BreveState[ 'popover' ] = {},
	action: { type: string; isHover?: boolean; anchor?: HTMLElement | EventTarget }
) {
	switch ( action.type ) {
		case 'SET_HIGHLIGHT_HOVER':
			return {
				...state,
				isHighlightHover: action.isHover,
			};

		case 'SET_POPOVER_HOVER':
			return {
				...state,
				isPopoverHover: action.isHover,
				frozenAnchor: action.isHover ? ( state.anchors ?? [] )[ ( state.level ?? 1 ) - 1 ] : null,
			};

		case 'SET_POPOVER_ANCHOR': {
			if ( ! action.anchor ) {
				return state;
			}

			const anchors = [ ...( state.anchors ?? [] ) ];

			anchors[ Math.max( ( state.level ?? 1 ) - 1, 0 ) ] = action.anchor;

			return {
				...state,
				anchors,
			};
		}

		case 'INCREASE_POPOVER_LEVEL': {
			const level = ( state.level ?? 0 ) + 1;

			return {
				...state,
				level,
			};
		}

		case 'DECREASE_POPOVER_LEVEL': {
			const level = Math.max( ( state.level ?? 1 ) - 1, 0 );
			const anchors = ( state.anchors ?? [] ).slice( 0, level );

			return {
				...state,
				level,
				anchors,
			};
		}
	}

	return state;
}

export default combineReducers( { popover, configuration } );
