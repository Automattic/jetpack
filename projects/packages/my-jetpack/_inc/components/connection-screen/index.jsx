import { Container, Col, AdminPage, getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import CloseLink from '../close-link';
import appleLogo from './apple.svg';
import connectImage from './connect.png';
import googleLogo from './google.svg';
import styles from './styles.module.scss';
import wordpressLogo from './wordpress.svg';

const ConnectionScreenFooter = () => {
	return (
		<>
			{ /* not using p here since connect screen apply styles for all p down the tree */ }
			{ /* https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/connection/components/connect-screen/layout/style.scss#L49-L54 */ }
			<div className={ styles[ 'account-description' ] }>
				{ __(
					'You can use your existing account on any of these services:',
					'jetpack-my-jetpack'
				) }
			</div>
			<ul className={ styles[ 'account-images' ] }>
				<li>
					<img
						src={ wordpressLogo }
						className={ styles.wordpress }
						alt={ __( 'WordPress Logo', 'jetpack-my-jetpack' ) }
					/>
				</li>
				<li>
					<img
						src={ googleLogo }
						className={ styles.google }
						alt={ __( 'Google Logo', 'jetpack-my-jetpack' ) }
					/>
				</li>
				<li>
					<img
						src={ appleLogo }
						className={ styles.apple }
						alt={ __( 'Apple Logo', 'jetpack-my-jetpack' ) }
					/>
				</li>
			</ul>
		</>
	);
};

const ConnectionScreen = () => {
	const { apiRoot, apiNonce } = useMyJetpackConnection();
	const returnToPage = useMyJetpackReturnToPage();

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
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
						from="my-jetpack"
						redirectUri={ returnToPage }
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

/**
 * Looks at query parameters to determine where the browser should go
 * after a user connection is established. Usually the My Jetpack root
 * is a safe bet, but in some instances (e.g., trying to activate a license),
 * it's easier on people to be sent back to a different page
 * (e.g., the license activation form).
 *
 * @returns {string} the URL of a My Jetpack page that should be displayed after connection.
 */
const useMyJetpackReturnToPage = () => {
	const [ searchParams ] = useSearchParams();

	const returnTo = searchParams.get( 'returnTo' );
	if ( returnTo ) {
		return `admin.php?page=my-jetpack#/${ returnTo }`;
	}

	return `admin.php?page=my-jetpack`;
};

export default ConnectionScreen;
