import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useOauthConnection from '../../../hooks/use-oauth-connection';
import appleIcon from '../icons/apple.svg';
import githubIcon from '../icons/github.svg';
import googleIcon from '../icons/google.svg';
import jetpackIcon from '../icons/jetpack.svg';
import styles from './styles.module.scss';
import type { SocialService } from '../../../hooks/use-oauth-connection';
import type { FC } from 'react';

type SocialButtonProps = {
	service: SocialService;
	disabled: boolean;
	onSubmit?: () => void;
};

const SocialButton: FC< SocialButtonProps > = ( { service, disabled, onSubmit } ) => {
	const [ isClicked, setIsClicked ] = useState( false );
	const { handleSocialLogin, isLoadingAuthorizeUrl, isRedirecting } = useOauthConnection();

	const { siteIsRegistering } = useMyJetpackConnection();

	const buttonText: Record< SocialService, { label: string; icon: string } > = {
		google: { label: __( 'Start with Google', 'jetpack-my-jetpack' ), icon: googleIcon },
		apple: { label: __( 'Start with Apple', 'jetpack-my-jetpack' ), icon: appleIcon },
		github: { label: __( 'Start with GitHub', 'jetpack-my-jetpack' ), icon: githubIcon },
		jetpack: { label: __( 'Start with Jetpack app', 'jetpack-my-jetpack' ), icon: jetpackIcon },
	};

	const handleOnClick = useCallback( () => {
		setIsClicked( true );
		onSubmit?.();
		handleSocialLogin( service );
	}, [ service, onSubmit, handleSocialLogin ] );

	const isLoading = isLoadingAuthorizeUrl || isRedirecting || ( isClicked && siteIsRegistering );
	const serviceText = buttonText[ service ];
	const { label, icon } = serviceText;

	const getAriaLabel = useMemo( () => {
		if ( isLoading ) {
			return __( 'Connecting…', 'jetpack-my-jetpack', 0 );
		}

		return label;
	}, [ isLoading, label ] );

	return (
		<button
			className={ styles[ 'social-button' ] }
			disabled={ disabled || isLoading }
			onClick={ handleOnClick }
			aria-busy={ isLoading }
			aria-label={ getAriaLabel }
		>
			<img src={ icon } alt="" aria-hidden="true" />
			<span className={ styles[ 'social-button-text' ] }>
				{ isLoading ? <Spinner className={ styles.spinner } /> : label }
			</span>
		</button>
	);
};

export default SocialButton;
