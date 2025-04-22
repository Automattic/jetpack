import { TermsOfService, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useOauthConnection from '../../../hooks/use-oauth-connection';
import preventWidows from '../../../utils/prevent-widows';
import EmailInput from './email-input';
import SocialButton from './social-button';
import styles from './styles.module.scss';
import type { SocialService, SubmitType } from '../../../hooks/use-oauth-connection';

const Separator = () => {
	return (
		<div className={ styles.separator }>
			<div className={ styles.line }></div>

			{ /* translators: 'or' is a separator between two options */ }
			<span>{ __( 'or', 'jetpack-my-jetpack' ) }</span>
			<div className={ styles.line }></div>
		</div>
	);
};

const ConnectionForm = () => {
	const [ isActionInitiated, setIsActionInitiated ] = useState( false );
	const [ lastClicked, setLastClicked ] = useState< SubmitType | null >( null );
	const oauthConnectionData = useOauthConnection();
	const {
		errorType,
		handleSubmitEmail,
		handleSocialLogin,
		isLoading: isLoadingOauth,
		resetState,
		setUserEmail,
	} = oauthConnectionData;

	const socialConnectionTitle = __( 'Start with Jetpack for free', 'jetpack-my-jetpack' );
	const socialConnectionDescription = __(
		'Log in with your WordPress.com account to supercharge your site with powerful growth, performance, and security tools.',
		'jetpack-my-jetpack'
	);

	useEffect( () => {
		if ( errorType && lastClicked ) {
			setIsActionInitiated( false );
		}
	}, [ errorType, lastClicked ] );

	const handleSubmit: ( submitType: SubmitType ) => void = useCallback(
		submitType => {
			resetState();
			setLastClicked( submitType );

			if ( submitType === 'email' ) {
				handleSubmitEmail();
			} else {
				// Ensure to reset the email when using social login.
				setUserEmail( '' );
				handleSocialLogin( submitType );
			}

			setIsActionInitiated( true );
		},
		[ handleSubmitEmail, handleSocialLogin, resetState, setUserEmail ]
	);

	const isLoading = useMemo( () => {
		if ( errorType ) {
			return false;
		}

		return isLoadingOauth || isActionInitiated;
	}, [ isLoadingOauth, isActionInitiated, errorType ] );

	// Jetpack app is not supported for login yet.
	const services = [ 'google', 'apple', 'github' ];

	return (
		<div className={ styles[ 'connection-form' ] }>
			<Text variant="headline-medium" className={ styles.title }>
				{ preventWidows( socialConnectionTitle ) }
			</Text>

			<Text variant="body" className={ styles.description }>
				{ preventWidows( socialConnectionDescription ) }
			</Text>

			{ services.map( ( service: SocialService ) => (
				<SocialButton
					key={ service }
					service={ service }
					disabled={ isActionInitiated }
					onSubmit={ handleSubmit }
					loading={ isLoading }
					lastClicked={ lastClicked }
					errorType={ errorType }
				/>
			) ) }

			<Separator />

			<EmailInput
				isDisabled={ isActionInitiated }
				loading={ isLoading }
				onSubmit={ handleSubmit }
				lastClicked={ lastClicked }
				oauthConnectionData={ oauthConnectionData }
			/>

			<TermsOfService isTextOnly={ true } className={ styles.tos } />
		</div>
	);
};

export default ConnectionForm;
