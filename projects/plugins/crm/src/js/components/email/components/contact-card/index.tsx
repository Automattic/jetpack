import { dispatch } from '@wordpress/data';
import { useSelect } from '@wordpress/data';
import classNames from 'classnames';
import { Contact } from 'crm/state/email/types';
import { store } from 'crm/state/store';
import styles from './styles.module.scss';

type ContactCardProps = {
	contact: Contact;
};

export const ContactCard: React.FC< ContactCardProps > = ( { contact } ) => {
	const selectedContactId = useSelect( select => select( store ).getSelectedContactId(), [] );

	const clickFunction = () => dispatch( store ).setSelectedContactId( contact.contact_id );

	const selected = selectedContactId === contact.contact_id;

	return (
		<div
			role="option"
			aria-selected={ selected }
			tabIndex={ 0 }
			className={ classNames( styles.card, {
				[ styles.selected ]: selected,
			} ) }
			onClick={ clickFunction }
			onKeyDown={ clickFunction }
		>
			{ contact.name }
		</div>
	);
};
