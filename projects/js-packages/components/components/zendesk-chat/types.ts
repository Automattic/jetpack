import type { FC } from 'react';

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		zE: Function;
	}
}

interface ZendeskChatProps {
	jwt_token: string;
}

export type ZendeskChatType = FC< ZendeskChatProps >;
