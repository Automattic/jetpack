import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
} from '@chatscope/chat-ui-kit-react';
import chatStyles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { client, xml } from '@xmpp/client';
import React, { useState, useEffect } from 'react';

const xmpp = client( {
	service: 'ws://localhost:5443/ws', // TODO: Replace with actual XMPP server (use ws instead of wss for local testing if your server doesn't have TLS enabled)
	domain: 'localhost',
	username: 'kthai15@localhost', // TODO: Replace with actual username
	password: 'password',
} );

const ChatForm = () => {
	const [ messages, setMessages ] = useState( [] );
	const [ botJid, setBotJid ] = useState( '' );

	const handleSend = async text => {
		// TODO: Send message to XMPP server and update messages state
		const message = xml( 'message', { type: 'chat', to: botJid }, xml( 'body', {}, text ) );
		await xmpp.send( message );

		setMessages( prevMessages => [ ...prevMessages, { text, isOwn: true } ] );
	};

	useEffect( () => {
		/**
		 *
		 */
		function disconnectXMPP() {
			xmpp.send( xml( 'presence', { type: 'unavailable' } ) );
			xmpp.stop().catch( console.error );
		}
		window.addEventListener( 'beforeunload', disconnectXMPP );

		xmpp.on( 'error', err => {
			console.error( err );
		} );
		xmpp.on( 'online', async jid => {
			console.log( 'online as', jid.toString() );

			// Makes itself available
			await xmpp.send( xml( 'presence' ) );

			const chat_request = { jid: jid.toString() };
			const response = await fetch( 'https://public-api.wordpress.com/wpcom/v2/odie/start_chat', {
				method: 'POST',
				body: JSON.stringify( chat_request ),
				headers: {
					'Content-Type': 'application/json',
				},
			} );
			console.log( 'response', response );
		} );
		xmpp.on( 'stanza', stanza => {
			if ( stanza.is( 'message' ) && stanza.getChild( 'body' ) ) {
				setBotJid( stanza.attrs.from );

				const message = stanza.getChild( 'body' ).getText();
				setMessages( prevMessages => [ ...prevMessages, { text: message, isOwn: false } ] );
			}
		} );
		xmpp.on( 'offline', () => {
			console.log( 'offline' );
		} );

		// Start the XMPP client
		xmpp.start().catch( console.error );
	}, [] );

	return (
		<div>
			<h3>Chat:</h3>
			<MainContainer>
				<ChatContainer>
					<MessageList>
						{ messages.map( ( message, index ) => (
							<Message
								key={ index }
								model={ {
									message: message.text,
									sentTime: message.sentTime
										? message.sentTime.toISOString()
										: new Date().toISOString(),
									sender: message.sender ?? 'someone',
									direction: message.isOwn ? 'outgoing' : 'incoming',
								} }
							/>
						) ) }
					</MessageList>
					<MessageInput
						onSend={ handleSend }
						placeholder="Say something nice"
						attachButton={ false }
					/>
				</ChatContainer>
			</MainContainer>
		</div>
	);
};

export default ChatForm;
