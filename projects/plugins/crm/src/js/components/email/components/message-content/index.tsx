import { useSelect } from '@wordpress/data';
import { useMessagesQuery } from 'crm/state/email/hooks';
import { store } from 'crm/state/store';

export const MessageContent: React.FC = () => {
	const selectedMessageId = useSelect( select => select( store ).getSelectedMessageId(), [] );

	const { data } = useMessagesQuery();
	const { messages } = data ?? {};

	return <div>{ selectedMessageId && messages?.[ selectedMessageId ]?.content }</div>;
};
