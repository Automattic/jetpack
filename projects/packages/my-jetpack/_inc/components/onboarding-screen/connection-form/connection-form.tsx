import { TermsOfService, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import preventWidows from '../../../utils/prevent-widows';
import styles from './connection-form.module.scss';
import EmailInput from './email-input';
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
	const socialConnectionTitle = __( 'Start with Jetpack for free', 'jetpack-my-jetpack' );
	const socialConnectionDescription = __(
		'Log in with your WordPress.com account to supercharge your site with powerful growth, performance, and security tools.',
		'jetpack-my-jetpack'
	);

	return (
		<div className={ styles[ 'connection-form' ] }>
			<Text variant="headline-medium" className={ styles.title }>
				{ preventWidows( socialConnectionTitle ) }
			</Text>

			<Text variant="body" className={ styles.description }>
				{ preventWidows( socialConnectionDescription ) }
			</Text>

			<SocialButton service="google" />
			<SocialButton service="apple" />
			<SocialButton service="github" />
			<SocialButton service="jetpack" />

			<Separator />

			<EmailInput isDisabled={ false } />

			<TermsOfService isTextOnly={ true } className={ styles.tos } />
		</div>
	);
};

export default ConnectionForm;
