import type { EmailState } from './reducer';

export const getSelectedContactId = ( state: { email: EmailState } ) => {
	return state.email.selectedContactId;
};

export const getSelectedMessageId = ( state: { email: EmailState } ) => {
	return state.email.selectedMessageId;
};
