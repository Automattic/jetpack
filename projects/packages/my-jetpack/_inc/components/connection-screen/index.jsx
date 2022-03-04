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
import wordpressLogo from './wordpress.png';
import googleLogo from './google.png';
import appleLogo from './apple.png';
import connectImage from './connect.png';
import styles from './styles.module.scss';

const ConnectionScreenFooter = () => {
	return (
		<>
			{ /* not using p here since connect screen apply styles for all p down the tree */ }
			{ /* https://github.com/Automattic/jetpack/blob/master/projects/js-packages/connection/components/connect-screen/layout/style.scss#L49-L54 */ }
			<div className={ styles[ 'account-description' ] }>
				{ __(
					'You can use your existing account on any of these services:',
					'jetpack-my-jetpack'
				) }
			</div>
			<span className={ styles[ 'account-images' ] }>
				<img
					src={ wordpressLogo }
					className={ styles.wordpress }
					alt={ __( 'Wordpress Logo', 'jetpack-my-jetpack' ) }
				/>
				<img src={ googleLogo } alt={ __( 'Google Logo', 'jetpack-my-jetpack' ) } />
				<img
					src={ appleLogo }
					className={ styles.apple }
					alt={ __( 'Apple Logo', 'jetpack-my-jetpack' ) }
				/>
			</span>
		</>
	);
};

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
						footer={ <ConnectionScreenFooter /> }
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
