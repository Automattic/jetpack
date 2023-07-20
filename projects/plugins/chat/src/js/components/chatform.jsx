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

const botJid = 'wapuu-bot@localhost'; // TODO: Replace with env var?
const jid = 'kthai15@localhost'; // TODO: Need to figure out how we're going to register a new user
const xmpp = client( {
	service: 'ws://localhost:5443/ws', // TODO: Replace with actual XMPP server (use ws instead of wss for local testing if your server doesn't have TLS enabled)
	domain: 'localhost',
	username: jid,
	password: 'password',
} );

const ChatForm = () => {
	const [ messages, setMessages ] = useState( [] );

	// TODO: add an argument to the start_chat endpoint to specify whether or not the bot should send an initial user prompt, depending if the user has any message history
	const startChatSession = async count => {
		const chat_request = { jid: jid.toString() };
		const response = await fetch( 'https://public-api.wordpress.com/wpcom/v2/odie/start_chat', {
			method: 'POST',
			body: JSON.stringify( chat_request ),
			headers: {
				'Content-Type': 'application/json',
			},
		} );
		console.log( 'response', response );
	};

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

			// Send a MAM query to retrieve message history
			const mamQuery = xml(
				'iq',
				{ type: 'set', id: 'mam1' },
				xml( 'query', { xmlns: 'urn:xmpp:mam:2', queryid: 'mam2' }, [
					xml( 'x', { xmlns: 'jabber:x:data', type: 'submit' }, [
						xml(
							'field',
							{ var: 'FORM_TYPE', type: 'hidden' },
							xml( 'value', {}, 'urn:xmpp:mam:2' )
						),
					] ),
					xml( 'set', { xmlns: 'http://jabber.org/protocol/rsm' }, [
						xml( 'max', {}, 10 ),
						xml( 'before', {} ),
					] ),
				] )
			);
			xmpp.send( mamQuery ).catch( console.error );
		} );
		xmpp.on( 'offline', () => {
			console.log( 'offline' );
		} );
		xmpp.on( 'stanza', stanza => {
			console.log( `Received stanza: ${ stanza }` );

			if ( stanza.is( 'message' ) ) {
				// Handle received message
				if ( stanza.getChild( 'body' ) ) {
					const message = stanza.getChild( 'body' ).getText();
					setMessages( prevMessages => [ ...prevMessages, { text: message, isOwn: false } ] );
				}

				// Handle received message history
				if ( stanza.getChild( 'result' ) ) {
					const recentMessages = stanza
						.getChild( 'result' )
						.getChildren( 'forwarded' )
						.map( forwarded => {
							const message = forwarded.getChild( 'message' );
							const body = message.getChild( 'body' );
							const delay = forwarded.getChild( 'delay' );

							return {
								text: body.getText(),
								sentTime: delay ? new Date( delay.attrs.stamp ) : null,
								isOwn: message.attrs.from.split( '/' )[ 0 ] === jid,
							};
						} );
					setMessages( prevMessages => [ ...prevMessages, ...recentMessages ] );
				}
			}

			if ( stanza.is( 'iq' ) ) {
				// If the user has no message history, then we want to start a chat with an initial bot message
				if ( stanza.getChild( 'fin' ) ) {
					const count = parseInt(
						stanza.getChild( 'fin' ).getChild( 'set' ).getChild( 'count' ).getText()
					);
					startChatSession( count );
				}
			}
		} );

		// Start the XMPP client
		xmpp.start().catch( console.error );
	}, [] );

	return (
		<div>
			<h3>Chat:</h3>
			<MainContainer responsive>
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
