import { dispatch } from '@wordpress/data';
import { useSelect } from '@wordpress/data';
import classNames from 'classnames';
import { Contact } from 'crm/state/inbox/types';
import { store } from 'crm/state/store';
import styles from './styles.module.scss';

type ContactCardProps = {
	contact: Contact;
};

export const ContactCard: React.FC< ContactCardProps > = ( { contact } ) => {
	const selectedContactId = useSelect( select => select( store ).getSelectedContactId(), [] );

	const clickFunction = () => dispatch( store ).setSelectedContactId( contact.id );

	const selected = selectedContactId === contact.id;

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
