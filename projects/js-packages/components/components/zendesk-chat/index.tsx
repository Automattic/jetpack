import { useEffect, useCallback } from 'react';
import { chatKey } from './constants';
import type { ZendeskChatType } from './types';

export const ZendeskChat: ZendeskChatType = ( { jwt_token } ) => {
	const authenticateUser = useCallback( () => {
		if ( typeof window !== 'undefined' && typeof window.zE === 'function' ) {
			window.zE( 'messenger', 'loginUser', function ( callback ) {
				callback( jwt_token );
			} );
		}
	}, [ jwt_token ] );

	useEffect( () => {
		const script = document.createElement( 'script' );
		const container = document.getElementById( 'zendesk-chat-container' );

		script.src = 'https://static.zdassets.com/ekr/snippet.js?key=' + encodeURIComponent( chatKey );
		script.type = 'text/javascript';
		script.id = 'ze-snippet';

		script.onload = () => {
			authenticateUser();
		};

		if ( container ) {
			container.appendChild( script );
		}
	}, [ authenticateUser ] );

	return <div data-testid="zendesk-chat-container" id="zendesk-chat-container" />;
};

export default ZendeskChat;
