/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { Container, Col, AdminPage, getRedirectUrl } from '@automattic/jetpack-components';
import { Icon, external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import CloseLink from '../close-link';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import connectImage from './connect.png';
import styles from './styles.module.scss';

const ConnectionScreen = () => {
	const { apiRoot, apiNonce } = useMyJetpackConnection();
	return (
		<AdminPage showHeader={ false } showBackground={ false } a8cLogoHref="https://automattic.com">
			<Container horizontalSpacing={ 8 } horizontalGap={ 0 }>
				<Col className={ styles[ 'relative-col' ] }>
					<CloseLink className={ styles[ 'close-link' ] } />
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
							<li>
								{ __( 'And more!', 'jetpack-my-jetpack' ) }{ ' ' }
								<a
									href={ getRedirectUrl( 'jetpack-features' ) }
									target="_blank"
									className={ styles[ 'all-features' ] }
									rel="noreferrer"
								>
									{ __( 'See all Jetpack features', 'jetpack-my-jetpack' ) }
									<Icon icon={ external } />
								</a>
							</li>
						</ul>
					</ConnectScreen>
				</Col>
			</Container>
		</AdminPage>
	);
};

export default ConnectionScreen;
