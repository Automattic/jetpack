import type { InboxState } from './reducer';

export const getSelectedContactId = ( state: { email: InboxState } ) => {
	return state.email.selectedContactId;
};

export const getSelectedMessageId = ( state: { email: InboxState } ) => {
	return state.email.selectedMessageId;
};
