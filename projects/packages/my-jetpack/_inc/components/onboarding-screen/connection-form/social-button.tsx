import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useOauthConnection, { SocialService } from '../../../hooks/use-oauth-connection';
import appleIcon from '../icons/apple.svg';
import githubIcon from '../icons/github.svg';
import googleIcon from '../icons/google.svg';
import jetpackIcon from '../icons/jetpack.svg';
import styles from './styles.module.scss';

type SocialButtonProps = {
	service: SocialService; // TODO: Add jetpack
	disabled: boolean;
	onSubmit?: () => void;
};

const SocialButton = ( { service, disabled, onSubmit }: SocialButtonProps ) => {
	const { handleSocialLogin, isLoadingAuthorizeUrl, isRedirecting } = useOauthConnection();

	const buttonText: Record< SocialService, { label: string; icon: string } > = {
		google: { label: __( 'Start with Google', 'jetpack-my-jetpack' ), icon: googleIcon },
		apple: { label: __( 'Start with Apple', 'jetpack-my-jetpack' ), icon: appleIcon },
		github: { label: __( 'Start with GitHub', 'jetpack-my-jetpack' ), icon: githubIcon },
		jetpack: { label: __( 'Start with Jetpack app', 'jetpack-my-jetpack' ), icon: jetpackIcon },
	};

	const handleOnClick = useCallback( () => {
		onSubmit?.();
		handleSocialLogin( service );
	}, [ service, onSubmit, handleSocialLogin ] );

	const isLoading = isLoadingAuthorizeUrl || isRedirecting;

	return (
		<button
			className={ styles[ 'social-button' ] }
			disabled={ disabled || isLoading }
			onClick={ handleOnClick }
		>
			<img src={ buttonText[ service ].icon } alt={ buttonText[ service ].label } />
			<span className={ styles[ 'social-button-text' ] }>{ buttonText[ service ].label }</span>
		</button>
	);
};

export default SocialButton;
