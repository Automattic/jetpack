import { useMemo } from 'react';
import { getUserLocale } from '../../lib/locale';
import utils from './utils';
import ZendeskChatScript from './zendesk-chat-script';
import type { ZendeskChatType } from './types';

export const ZendeskChat: ZendeskChatType = () => {
	const { isWithinAvailableChatTimes, isWithinAvailableChatDays } = utils;

	const shouldShowZendeskPresalesChat = useMemo( () => {
		const currentTime = new Date();
		const isEnglishLocale = getUserLocale().startsWith( 'en' );

		return (
			isEnglishLocale &&
			isWithinAvailableChatDays( currentTime ) &&
			isWithinAvailableChatTimes( currentTime )
		);
	}, [ isWithinAvailableChatDays, isWithinAvailableChatTimes ] );

	return shouldShowZendeskPresalesChat ? <ZendeskChatScript /> : null;
};

export default ZendeskChat;
