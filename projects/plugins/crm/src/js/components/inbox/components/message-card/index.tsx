import { useSelect, dispatch } from '@wordpress/data';
import classNames from 'classnames';
import { Message } from 'crm/state/email/types';
import { store } from 'crm/state/store';
import styles from './styles.module.scss';

type MessageCardProps = {
	message: Message;
};

export const MessageCard: React.FC< MessageCardProps > = ( { message } ) => {
	const selectedMessageId = useSelect( select => select( store ).getSelectedMessageId(), [] );

	const clickFunction = () => dispatch( store ).setSelectedMessageId( message.id );

	const selected = selectedMessageId === message.id;

	return (
		<div
			role="option"
			aria-selected={ selected }
			tabIndex={ 0 }
			className={ classNames( styles.card, {
				[ styles.selected ]: message.id === selectedMessageId,
			} ) }
			onClick={ clickFunction }
			onKeyDown={ clickFunction }
		>
			{ message.subject }
		</div>
	);
};
