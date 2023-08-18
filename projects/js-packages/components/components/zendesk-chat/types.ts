import type { FC } from 'react';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/ban-types
		zE: Function;
	}
}

interface ZendeskChatProps {
	jwt_token: string;
}

export type ZendeskChatType = FC< ZendeskChatProps >;
