import { SET_SELECTED_CONTACT_ID, SET_SELECTED_MESSAGE_ID } from 'crm/state/action-types';

export type EmailAction = SetSelectedContactIdAction | SetSelectedMessageIdAction;

export type SetSelectedContactIdAction = {
	type: SET_SELECTED_CONTACT_ID;
	contactId: number;
};

export const setSelectedContactId = ( contactId: number ) => {
	return {
		type: 'SET_SELECTED_CONTACT_ID',
		contactId,
	} as SetSelectedContactIdAction;
};

export type SetSelectedMessageIdAction = {
	type: SET_SELECTED_MESSAGE_ID;
	messageId: number;
};

export const setSelectedMessageId = ( messageId: number ) => {
	return {
		type: 'SET_SELECTED_MESSAGE_ID',
		messageId,
	} as SetSelectedMessageIdAction;
};
