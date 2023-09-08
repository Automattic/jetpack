import type { EmailAction } from './actions';

export type EmailState = {
	selectedContactId: number | undefined;
	selectedMessageId: number | undefined;
};

const defaultEmailState = { selectedContactId: undefined, selectedMessageId: undefined };

export const email = ( ( state: EmailState = defaultEmailState, action: EmailAction ) => {
	switch ( action.type ) {
		case 'SET_SELECTED_CONTACT_ID':
			return {
				...state,
				selectedContactId: action.contactId,
				selectedMessageId:
					state.selectedContactId === action.contactId ? state.selectedMessageId : undefined,
			};
		case 'SET_SELECTED_MESSAGE_ID':
			return { ...state, selectedMessageId: action.messageId };
		default:
			return state;
	}
} ) as ( state: EmailState, action: EmailAction ) => EmailState;
