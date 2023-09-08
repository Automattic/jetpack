import { ContactSelector } from '../contact-selector';
import { MessageContent } from '../message-content';
import { MessageSelector } from '../message-selector';
import styles from './styles.module.scss';
import type { Contact, Message } from '../../types';

type InboxProps = {
	contacts: Contact[];
	messages: Message[];
};

export const Inbox: React.FC< InboxProps > = ( { contacts, messages } ) => {
	return (
		<div className={ styles.container }>
			<ContactSelector contacts={ contacts } />
			<MessageSelector messages={ messages } />
			<MessageContent />
		</div>
	);
};
