/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { Container, Col } from '@automattic/jetpack-components';
import { Link } from 'react-router-dom';
import { Icon, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import connectImage from './connect.png';

const ConnectionScreen = () => {
	const { apiRoot, apiNonce } = useMyJetpackConnection();
	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
			<Col>
				<Link to="/" className={ styles.link }>
					<Icon icon={ arrowLeft } className={ styles.icon } />
					{ __( 'Go back', 'jetpack-my-jetpack' ) }
				</Link>
			</Col>
			<Col>
				<ConnectScreen
					title={ __(
						'Unlock all the amazing features of Jetpack by connecting now',
						'jetpack-my-jetpack'
					) }
					buttonLabel={ __( 'Connect your user account', 'jetpack-my-jetpack' ) }
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					images={ [ connectImage ] }
				>
					<ul>
						<li>{ __( 'Receive instant downtime alerts', 'jetpack-my-jetpack' ) }</li>
						<li>
							{ __( 'Automatically share your content on social media', 'jetpack-my-jetpack' ) }
						</li>
						<li>{ __( 'Let your subscribers know when you post', 'jetpack-my-jetpack' ) }</li>
						<li>
							{ __( 'Receive notifications about new likes and comments', 'jetpack-my-jetpack' ) }
						</li>
						<li>
							{ __( 'Let visitors share your content on social media', 'jetpack-my-jetpack' ) }
						</li>
					</ul>
				</ConnectScreen>
			</Col>
		</Container>
	);
};

export default ConnectionScreen;
