import { useMemo } from 'react';
import { getUserLocale } from '../../lib/locale';
import {
	isWithinShutdownDates,
	isWithinAvailableChatTimes,
	isWithinAvailableChatDays,
} from './utils';
import ZendeskChatScript from './zendesk-chat-script';
import type { ZendeskChatType } from './types';

export const ZendeskChat: ZendeskChatType = () => {
	const shouldShowZendeskPresalesChat = useMemo( () => {
		const currentTime = new Date();
		if ( isWithinShutdownDates( currentTime ) ) {
			return false;
		}
		const isEnglishLocale = getUserLocale().startsWith( 'en' );

		return (
			isEnglishLocale &&
			isWithinAvailableChatDays( currentTime ) &&
			isWithinAvailableChatTimes( currentTime )
		);
	}, [] );

	return shouldShowZendeskPresalesChat ? <ZendeskChatScript /> : null;
};

export default ZendeskChat;
