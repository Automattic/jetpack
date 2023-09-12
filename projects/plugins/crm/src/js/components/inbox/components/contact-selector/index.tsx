import { Contact } from 'crm/state/inbox/types';
import { ContactCard } from '../contact-card';
import styles from './styles.module.scss';

type ContactSelectorProps = { contacts: Contact[] };

export const ContactSelector: React.FC< ContactSelectorProps > = ( { contacts } ) => {
	return (
		<div className={ styles.selector }>
			{ Object.values( contacts ).map( contact => (
				<ContactCard contact={ contact } />
			) ) }
		</div>
	);
};
