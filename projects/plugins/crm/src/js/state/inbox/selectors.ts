import type { InboxState } from './reducer';

export const getSelectedContactId = ( state: { inbox: InboxState } ) => {
	return state.inbox.selectedContactId;
};

export const getSelectedMessageId = ( state: { inbox: InboxState } ) => {
	return state.inbox.selectedMessageId;
};
