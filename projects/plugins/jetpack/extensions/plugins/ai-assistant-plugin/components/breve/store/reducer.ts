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
			};

		case 'SET_POPOVER_ANCHOR': {
			if ( ! action.anchor ) {
				return state;
			}

			return {
				...state,
				anchor: action.anchor,
			};
		}
	}

	return state;
}

export function suggestions(
	state = {},
	action: { type: string; id: string; feature: string; loading: boolean }
) {
	switch ( action.type ) {
		case 'SET_SUGGESTIONS_LOADING': {
			const { id, feature } = action;
			const current = { ...state };
			const currentItem = current?.[ feature ]?.[ id ] || {};

			return {
				...current,
				[ feature ]: {
					...( current[ feature ] ?? {} ),
					[ id ]: {
						...currentItem,
						loading: action.loading,
					},
				},
			};
		}
	}

	return state;
}

export default combineReducers( { popover, configuration, suggestions } );
