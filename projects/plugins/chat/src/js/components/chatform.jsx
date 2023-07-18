import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
} from '@chatscope/chat-ui-kit-react';
import chatStyles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { client } from '@xmpp/client';
import React, { useState, useEffect } from 'react';

const xmpp = client( {
	service: 'wss://localhost:5443/ws',
	domain: 'localhost',
	username: 'admin',
	password: 'password',
	resource: 'example',
} );

xmpp.on( 'error', err => {
	console.error( err );
} );
xmpp.on( 'online', jid => {
	console.log( 'online as', jid.toString() );
} );
xmpp.on( 'stanza', stanza => {
	console.log( 'stanza', stanza.toString() );
} );
xmpp.on( 'offline', () => {
	console.log( 'offline' );
} );

const ChatForm = () => {
	const [ messages, setMessages ] = useState( [] );
	const [ connected, setConnected ] = useState( false );

	const handleSend = text => {
		console.log( 'Sending message', text );
		// TODO: Send message to XMPP server and update messages state
		const response = `You said: ${ text }`;
		setMessages( [ ...messages, { text, isOwn: true }, { text: response, isOwn: false } ] );
	};

	const handleClear = () => {
		setMessages( [] );
	};

	const handleConnect = () => {
		xmpp.start().catch( err => console.error( err ) );
	};

	useEffect( () => {
		if ( xmpp.status === 'online' ) {
			setConnected( true );
		} else {
			setConnected( false );
		}
	}, [ xmpp.status ] );

	return (
		<div>
			{ ! connected && <button onClick={ handleConnect }>Connect to XMPP Server</button> }
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
			<button onClick={ handleClear }>Clear Chat</button>
		</div>
	);
};

export default ChatForm;
