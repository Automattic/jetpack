import { useSelect } from '@wordpress/data';
import { store } from 'crm/state/store';
import { MessageCard } from '../message-card';
import type { Message } from 'crm/state/inbox/types';

type MessageSelectorProps = {
	messages: Message[];
};

export const MessageSelector: React.FC< MessageSelectorProps > = ( { messages } ) => {
	const selectedContactId = useSelect( select => select( store ).getSelectedContactId(), [] );

	return (
		<div>
			{ Object.values( messages )
				.filter( message => message.sender_contact_id === selectedContactId )
				.map( message => (
					<MessageCard message={ message } />
				) ) }
		</div>
	);
};
