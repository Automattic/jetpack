import type { InboxAction } from './actions';

export type InboxState = {
	selectedContactId: number | undefined;
	selectedMessageId: number | undefined;
};

const defaultInboxState = { selectedContactId: undefined, selectedMessageId: undefined };

export const inbox = ( ( state: InboxState = defaultInboxState, action: InboxAction ) => {
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
} ) as ( state: InboxState, action: InboxAction ) => InboxState;
