import { ContactDetails } from '../contact-details';
import { ContactSelector } from '../contact-selector';
import { MessageContent } from '../message-content';
import { MessageSelector } from '../message-selector';
import styles from './styles.module.scss';
import type { Contact, Message } from 'crm/state/email/types';

type InboxProps = {
	contacts: Contact[];
	messages: Message[];
};

export const Inbox: React.FC< InboxProps > = ( { contacts, messages } ) => {
	return (
		<div className={ styles.container }>
			<ContactSelector contacts={ contacts } />
			<ContactDetails />
			<MessageSelector messages={ messages } />
			<MessageContent />
		</div>
	);
};
