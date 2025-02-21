import { SeoAssistantAction, SeoAssistantState } from '../types';

export function reducer( state: SeoAssistantState, action: SeoAssistantAction ) {
	switch ( action.type ) {
		case 'OPEN':
			return { ...state, isOpen: true };
		case 'CLOSE':
			return { ...state, isOpen: false };
		default:
			return state;
	}
}

export default reducer;
