/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

export function popover( state = { isOpen: false }, action ) {
	switch ( action.type ) {
		case 'SET_POPOVER_STATE':
			return {
				...state,
				isOpen: action.isOpen,
			};
	}

	return state;
}

export function content( state = [], action ) {
	switch ( action.type ) {
		case 'SET_BLOCK_TEXT': {
			const clientId = action.clientId;
			const blockText = action.text;
			const idx = action.index;

			if ( idx > -1 ) {
				const newState = [ ...state ];
				newState[ idx ].text = blockText;
				return newState;
			}

			return [
				...state,
				{
					clientId,
					text: blockText,
				},
			];
		}
	}

	return state;
}

export default combineReducers( { popover, content } );
