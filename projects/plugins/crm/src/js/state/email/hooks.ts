import { useQuery, UseQueryResult } from '@tanstack/react-query';
import axios from 'axios';
import { Contact, Message } from 'crm/state/email/types';

// TODO: this can be better
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let jpcrmEmailInitialState: any;

// TODO: messages should have real IDs
const getMessageId = ( message: Message ) => {
	const str = JSON.stringify( message );

	let hash = 5381;
	for ( let i = 0; i < str.length; i++ ) {
		const char = str.charCodeAt( i );
		hash = ( hash * 33 ) ^ char; // Multiply by 33 and XOR with current character
	}

	return hash >>> 0; // Convert to unsigned 32-bit integer
};

export function useMessagesQuery(): UseQueryResult<
	{ contacts: { [ contactId: number ]: Contact }; messages: { [ messageId: number ]: Message } },
	unknown
> {
	return useQuery( {
		queryKey: [ 'email', 'messages' ],
		select: axiosResponse => {
			const { contacts, messages }: { contacts: Contact[]; messages: Message[] } =
				axiosResponse.data;

			const identifiedMessages = messages.map( message => ( {
				...message,
				id: getMessageId( message ),
			} ) );

			return {
				contacts: contacts.reduce(
					( accumulator, contact ) => ( {
						...accumulator,
						[ contact.id ]: contact,
					} ),
					{}
				),
				messages: identifiedMessages.reduce(
					( accumulator, message ) => ( {
						...accumulator,
						[ message.id ]: message,
					} ),
					{}
				),
			};
		},
		queryFn: () =>
			axios.get< { contacts: Contact[]; messages: Message[] } >(
				`${ jpcrmEmailInitialState.apiRoot }jetpack-crm/v4/inbox/messages`
			),
	} );
}
