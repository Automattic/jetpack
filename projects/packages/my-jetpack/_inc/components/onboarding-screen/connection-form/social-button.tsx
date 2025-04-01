import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import appleIcon from '../icons/apple.svg';
import githubIcon from '../icons/github.svg';
import googleIcon from '../icons/google.svg';
import jetpackIcon from '../icons/jetpack.svg';
import ErrorMessage from './error-message';
import styles from './styles.module.scss';
import type {
	OauthErrorType,
	SocialService,
	SubmitType,
} from '../../../hooks/use-oauth-connection';
import type { FC } from 'react';

type SocialButtonProps = {
	service: SocialService;
	loading: boolean;
	disabled: boolean;
	onSubmit: ( submitType: SubmitType ) => void;
	lastClicked: SubmitType | null;
	errorType: OauthErrorType;
};

const buttonText: Record< SocialService, { label: string; icon: string } > = {
	google: { label: __( 'Start with Google', 'jetpack-my-jetpack' ), icon: googleIcon },
	apple: { label: __( 'Start with Apple', 'jetpack-my-jetpack' ), icon: appleIcon },
	github: { label: __( 'Start with GitHub', 'jetpack-my-jetpack' ), icon: githubIcon },
	jetpack: { label: __( 'Start with Jetpack app', 'jetpack-my-jetpack' ), icon: jetpackIcon },
};

const SocialButton: FC< SocialButtonProps > = ( {
	service,
	loading,
	disabled,
	onSubmit,
	lastClicked,
	errorType,
} ) => {
	const handleOnClick = useCallback( () => {
		onSubmit?.( service );
	}, [ service, onSubmit ] );

	const isLastClicked = useMemo( () => {
		return service === lastClicked;
	}, [ lastClicked, service ] );

	// Purpose of this is to only show errors and loading indicators
	// on the last clicked button, not on all buttons.
	const isThisLoading = useMemo( () => {
		return loading && isLastClicked;
	}, [ loading, isLastClicked ] );

	const serviceText = buttonText[ service ];
	const { label, icon } = serviceText;

	const getAriaLabel = useMemo( () => {
		if ( isThisLoading ) {
			return __( 'Connecting…', 'jetpack-my-jetpack', 0 );
		}

		return label;
	}, [ isThisLoading, label ] );

	return (
		<>
			<button
				className={ styles[ 'social-button' ] }
				disabled={ disabled || loading }
				onClick={ handleOnClick }
				aria-busy={ isThisLoading }
				aria-label={ getAriaLabel }
			>
				<img src={ icon } alt="" aria-hidden="true" />
				<span className={ styles[ 'social-button-text' ] }>
					{ isThisLoading ? <Spinner className={ styles.spinner } /> : label }
				</span>
			</button>
			{ isLastClicked && <ErrorMessage errorType={ errorType } service={ service } /> }
		</>
	);
};

export default SocialButton;
