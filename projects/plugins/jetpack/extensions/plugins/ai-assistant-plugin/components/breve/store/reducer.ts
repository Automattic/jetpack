/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

const enabledFromLocalStorage = window.localStorage.getItem( 'jetpack-ai-proofread-enabled' );
const initialConfiguration = {
	// TODO: Confirm that we will start it as true
	enabled: enabledFromLocalStorage === 'true' || enabledFromLocalStorage === null,
};

export function configuration( state = initialConfiguration, action ) {
	switch ( action.type ) {
		case 'SET_PROOFREAD_ENABLED': {
			const enabled = action?.enabled !== undefined ? action?.enabled : ! state?.enabled;
			window.localStorage.setItem( 'jetpack-ai-proofread-enabled', String( enabled ) );

			return {
				...state,
				enabled,
			};
		}
	}

	return state;
}

export function popover( state = {}, action ) {
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

		case 'SET_POPOVER_ANCHOR':
			return {
				...state,
				anchor: action.anchor,
			};
	}

	return state;
}

export default combineReducers( { popover, configuration } );
