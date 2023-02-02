import { useEffect, useMemo } from 'react';
import { getUserLocale } from '../../lib/locale';
import { chatKey } from './constants';
import type { ZendeskChatType, ZendeskChatScriptType, DateFunctionType } from './types';

// Checks if current time is within the days chat is available
const isWithinAvailableChatDays: DateFunctionType = ( currentTime: Date ) => {
	const [ SUNDAY, SATURDAY ] = [ 0, 6 ];
	const utcWeekDay = currentTime.getUTCDay();

	return utcWeekDay !== SUNDAY && utcWeekDay !== SATURDAY;
};

// Checks if the current time is within the times chat is consistently covered
const isWithinAvailableChatTimes: DateFunctionType = ( currentTime: Date ) => {
	const availableStartTime = 9; // Chat is available starting at 9:00 UTC
	const availableEndTime = 23; // Chat is no longer available after 23:00 UTC
	const currentUTCHour = currentTime.getUTCHours();

	if ( currentUTCHour >= availableStartTime && currentUTCHour < availableEndTime ) {
		return true;
	}

	return false;
};

// Checks if the current time is within chat shutdown days
const isWithinShutdownDates: DateFunctionType = ( currentTime: Date ) => {
	const startTime = new Date( Date.UTC( 2022, 11, 23 ) ); // Thu Dec 22 2022 19:00:00 (7:00pm) GMT-0500 (Eastern Standard Time)
	const endTime = new Date( Date.UTC( 2023, 0, 2 ) ); // Sun Jan 01 2023 19:00:00 (7:00pm) GMT-0500 (Eastern Standard Time)
	const currentDateUTC = new Date( currentTime.toUTCString() );
	if ( currentDateUTC > startTime && currentDateUTC < endTime ) {
		return true;
	}
	return false;
};

const ZendeskChatScript: ZendeskChatScriptType = () => {
	useEffect( () => {
		const script = document.createElement( 'script' );
		const container = document.getElementById( 'zendesk-chat-container' );

		script.src = 'https://static.zdassets.com/ekr/snippet.js?key=' + encodeURIComponent( chatKey );
		script.type = 'text/javascript';
		script.id = 'ze-snippet';

		if ( container ) {
			container.appendChild( script );
		}
	}, [] );

	return <div id="zendesk-chat-container" />;
};

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
