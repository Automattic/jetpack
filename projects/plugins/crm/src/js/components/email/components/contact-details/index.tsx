import { useSelect } from '@wordpress/data';
import { useMessagesQuery } from 'crm/state/email/hooks';
import { store } from 'crm/state/store';

export const ContactDetails = () => {
	const selectedContactId = useSelect( select => select( store ).getSelectedContactId(), [] );
	const { data } = useMessagesQuery();
	const { contacts } = data ?? {};

	const selectedContact = selectedContactId ? contacts?.[ selectedContactId ] : undefined;

	return (
		selectedContact && (
			<div>
				<div>{ selectedContact.name }</div>
				<div>{ selectedContact.status }</div>
				<div>{ `Total Paid: ${ selectedContact.transactions_value }` }</div>
				<div>{ `Total Due: ${ selectedContact.invoices_value }` }</div>
				<div>{ selectedContact.email }</div>
				<div>{ selectedContact.phone }</div>
			</div>
		)
	);
};
