import { __ } from '@wordpress/i18n';
import appleIcon from '../icons/apple.svg';
import githubIcon from '../icons/github.svg';
import googleIcon from '../icons/google.svg';
import jetpackIcon from '../icons/jetpack.svg';
import styles from './connection-form.module.scss';

type SocialButtonProps = {
	service: 'google' | 'apple' | 'github' | 'jetpack';
};

const SocialButton = ( { service }: SocialButtonProps ) => {
	const buttonText = {
		google: { label: __( 'Start with Google', 'jetpack-my-jetpack' ), icon: googleIcon },
		apple: { label: __( 'Start with Apple', 'jetpack-my-jetpack' ), icon: appleIcon },
		github: { label: __( 'Start with GitHub', 'jetpack-my-jetpack' ), icon: githubIcon },
		jetpack: { label: __( 'Start with Jetpack app', 'jetpack-my-jetpack' ), icon: jetpackIcon },
	};

	return (
		<button className={ styles[ 'social-button' ] }>
			<img src={ buttonText[ service ].icon } alt={ buttonText[ service ].label } />
			<span className={ styles[ 'social-button-text' ] }>{ buttonText[ service ].label }</span>
		</button>
	);
};

export default SocialButton;
