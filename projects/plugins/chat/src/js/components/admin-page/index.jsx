import { AdminPage, AdminSectionHero, Container, Col } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID, ConnectScreen } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import styles from './styles.module.scss';

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
							<h1 className={ styles.heading }>{ __( 'Jetpack Odie', 'jetpack-chat' ) }</h1>
							<h3>{ __( "Don't waste your time chatting with humans.", 'jetpack-chat' ) }</h3>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>{ __( 'Chat with your site.', 'jetpack-chat' ) }</li>
								<li>{ __( 'Chat with a bot.', 'jetpack-chat' ) }</li>
								<li>{ __( 'Chat chat chat.', 'jetpack-chat' ) }</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<div id="jetpack-odie-root"></div>
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
			title={ __( 'Jetpack Odie!', 'jetpack-chat' ) }
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
