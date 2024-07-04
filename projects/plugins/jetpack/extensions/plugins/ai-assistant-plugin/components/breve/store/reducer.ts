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
		case 'SET_BLOCK_CONTENT': {
			const clientId = action.clientId;
			const blockContent = action.content;
			const idx = state.findIndex( item => item.clientId === clientId );

			if ( idx !== -1 ) {
				const newState = [ ...state ];
				newState[ idx ].content = blockContent;
				return newState;
			}

			return [
				...state,
				{
					clientId,
					content: blockContent,
				},
			];
		}
	}

	return state;
}

export default combineReducers( { popover, content } );
