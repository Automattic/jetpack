import { useEffect } from 'react';
import { chatKey } from './constants';
import { ZendeskChatScriptType } from './types';

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

	return <div data-testid="zendesk-chat-container" id="zendesk-chat-container" />;
};

export default ZendeskChatScript;
