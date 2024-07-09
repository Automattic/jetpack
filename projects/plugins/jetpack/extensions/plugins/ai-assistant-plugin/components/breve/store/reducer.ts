/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

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
