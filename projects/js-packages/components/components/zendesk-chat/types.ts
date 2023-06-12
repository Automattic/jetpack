import type { FC } from 'react';

interface ZendeskChatProps {
	jwt_token: string;
}

export type ZendeskChatType = FC< ZendeskChatProps >;
