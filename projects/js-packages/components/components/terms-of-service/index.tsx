import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getRedirectUrl } from '../../../components';
import type { TermsOfServiceProps } from './types';

const Wrapper: React.FC< TermsOfServiceProps > = props => (
	<p className="terms-of-service">
		<Text { ...props } />
	</p>
);

const Text: React.FC< TermsOfServiceProps > = ( { multipleButtons, agreeButtonLabel } ) => {
	const tosLink = (
		<a
			className="terms-of-service__link"
			href={ getRedirectUrl( 'wpcom-tos' ) }
			rel="noopener noreferrer"
			target="_blank"
		/>
	);
	const shareDetailsLink = (
		<a
			className="terms-of-service__link"
			href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
			rel="noopener noreferrer"
			target="_blank"
		/>
	);

	if ( multipleButtons ) {
		return createInterpolateElement(
			__(
				'By clicking the buttons above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
				'jetpack'
			),
			{
				tosLink,
				shareDetailsLink,
			}
		);
	}

	return createInterpolateElement(
		sprintf(
			/* translators: %s is a button label */
			__(
				'By clicking the <strong>%s</strong> button, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
				'jetpack'
			),
			agreeButtonLabel
		),
		{
			strong: <strong />,
			tosLink,
			shareDetailsLink,
		}
	);
};

export default Wrapper;
