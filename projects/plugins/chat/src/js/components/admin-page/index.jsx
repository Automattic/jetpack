import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import {
	ConnectScreenRequiredPlan,
	CONNECTION_STORE_ID,
	ConnectScreen,
} from '@automattic/jetpack-connection';
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
} from '@chatscope/chat-ui-kit-react';
import chatStyles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { client, xml } from '@xmpp/client';
import React, { useState, useEffect } from 'react';
import styles from './styles.module.scss';

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

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	return (
		<AdminPage moduleName={ __( 'Jetpack Chat', 'jetpack-chat' ) }>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				) : (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col>
							<div id="jp-admin-notices" className="jetpack-chat-jitm-card" />
						</Col>
						<Col sm={ 4 } md={ 6 } lg={ 6 }>
							<h1 className={ styles.heading }>{ __( 'Jetpack Odysseus', 'jetpack-chat' ) }</h1>
							<h3>{ __( "Don't waste your time chatting with humans.", 'jetpack-chat' ) }</h3>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>{ __( 'Chat with your site.', 'jetpack-chat' ) }</li>
								<li>{ __( 'Chat with a bot.', 'jetpack-chat' ) }</li>
								<li>{ __( 'Chat chat chat.', 'jetpack-chat' ) }</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<ChatForm />
						</Col>
					</Container>
				) }
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackChatInitialState;
	return (
		<ConnectScreen
			buttonLabel={ __( 'Connect to start chatting', 'jetpack-chat' ) }
			title={ __( 'Jetpack Odysseus!', 'jetpack-chat' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-chat"
			redirectUri="admin.php?page=jetpack-chat"
		>
			<h3>{ __( "Don't waste your time chatting with humans.", 'jetpack-chat' ) }</h3>
			<ul>
				<li>{ __( 'Chat with your site.', 'jetpack-chat' ) }</li>
				<li>{ __( 'Chat with a bot.', 'jetpack-chat' ) }</li>
				<li>{ __( 'Chat chat chat.', 'jetpack-chat' ) }</li>
			</ul>
		</ConnectScreen>
	);
};
