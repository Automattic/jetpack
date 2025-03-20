import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './connection-form.module.scss';
import SocialButton from './social-button';

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
	return (
		<div className={ styles[ 'connection-form' ] }>
			<Text variant="headline-medium" className={ styles.title }>
				{ __( 'Start with Jetpack for free', 'jetpack-my-jetpack' ) }
			</Text>

			<Text variant="body" mb={ 3 } className={ styles.description }>
				{ __(
					'Log in with your WordPress.com account to supercharge your site with powerful growth, performance, and security tools.',
					'jetpack-my-jetpack'
				) }
			</Text>

			<SocialButton service="google" />
			<SocialButton service="apple" />
			<SocialButton service="github" />
			<SocialButton service="jetpack" />

			<Separator />
		</div>
	);
};

export default ConnectionForm;
