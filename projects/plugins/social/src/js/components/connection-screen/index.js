import { Dialog, ProductOffer, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import React from 'react';
import { STORE_ID } from '../../store';
import background from './background.svg';
import illustration from './illustration.png';
import styles from './styles.module.scss';
const ConnectionScreen = () => {
	const connectProps = useSelect( select => {
		const store = select( STORE_ID );
		return {
			apiRoot: store.getAPIRootUrl(),
			apiNonce: store.getAPINonce(),
			registrationNonce: store.getRegistrationNonce(),
		};
	} );

	const {
		userIsConnecting,
		siteIsRegistering,
		handleRegisterSite,
		registrationError,
	} = useConnection( {
		from: 'jetpack-social',
		redirectUri: 'admin.php?page=jetpack-social',
		...connectProps,
	} );

	const buttonText = __( 'Get Started', 'jetpack-social' );
	const tos = createInterpolateElement(
		sprintf(
			/* translators: placeholder is a button label */
			__(
				'By clicking the <strong>%s</strong> button, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
				'jetpack-social'
			),
			buttonText
		),
		{
			strong: <strong />,
			tosLink: (
				<a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />
			),
			shareDetailsLink: (
				<a
					href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
					rel="noopener noreferrer"
					target="_blank"
				/>
			),
		}
	);

	const getButtonDisclaimer = () => (
		<Text variant="body-small" className={ styles.tos } mt={ 3 }>
			{ tos }
		</Text>
	);

	return (
		<Dialog
			className={ styles.card }
			primary={
				<div className={ styles.column }>
					<ProductOffer
						className={ styles.offer }
						slug={ 'jetpack-social' }
						title={ 'Jetpack Social' }
						subTitle={ __(
							'Share your posts with your social media network and increase your site’s traffic',
							'jetpack-social'
						) }
						features={ [
							'Connect with Twitter, Facebook, LinkedIn and Tumblr',
							'Select the social media to share posts while publishing',
							'Publish custom messages',
						] }
						isCard={ false }
						isBundle={ false }
						onAdd={ handleRegisterSite }
						buttonText={ buttonText }
						icon="social"
						isLoading={ siteIsRegistering || userIsConnecting }
						buttonDisclaimer={ getButtonDisclaimer() }
						error={
							registrationError
								? __( 'An error occurred. Please try again.', 'jetpack-social' )
								: null
						}
					/>
				</div>
			}
			secondary={
				<div className={ styles.sidebar }>
					<img className={ styles.background } src={ background } alt="" />
					<img className={ styles.illustration } src={ illustration } alt="" />
				</div>
			}
		/>
	);
};

export default ConnectionScreen;
