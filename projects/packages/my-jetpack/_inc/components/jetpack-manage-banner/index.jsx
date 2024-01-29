import { UpsellBanner, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import jetpackManageIcon from './jetpack-manage.svg';

/**
 * Jetpack Manager Banner component that renders a banner with CTAs.
 *
 * @param {object} props - Component props.
 * @returns {object} The JetpackManageBanner component.
 */
const JetpackManageBanner = props => {
	const { isAgencyAccount } = props;

	// Set up the first CTA
	const ctaLearnMoreLabel = __( 'Learn more', 'jetpack-my-jetpack' );
	const ctaLearnMoreUrl = getRedirectUrl( 'my-jetpack-jetpack-manage-learn-more' );

	// Set up the second CTA
	const ctaManageSitesLabel = __( 'Manage sites', 'jetpack-my-jetpack' );
	const ctaManageSitesUrl = getRedirectUrl( 'my-jetpack-jetpack-manage-dashboard' );

	const ctaSignUpForFreeLabel = __( 'Sign up for free', 'jetpack-my-jetpack' );
	const ctaSignUpForFreeUrl = getRedirectUrl( 'my-jetpack-jetpack-manage-sign-up' );

	return (
		<UpsellBanner
			icon={ jetpackManageIcon }
			title={ __( 'Jetpack Manage', 'jetpack-my-jetpack' ) }
			description={ __(
				'Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention. Plus, get bulk discounts.',
				'jetpack-my-jetpack'
			) }
			secondaryCtaLabel={ ctaLearnMoreLabel }
			secondaryCtaURL={ ctaLearnMoreUrl }
			secondaryCtaIsExternalLink={ true }
			primaryCtaLabel={ isAgencyAccount ? ctaManageSitesLabel : ctaSignUpForFreeLabel }
			primaryCtaURL={ isAgencyAccount ? ctaManageSitesUrl : ctaSignUpForFreeUrl }
			primaryCtaIsExternalLink={ true }
		/>
	);
};

export default JetpackManageBanner;
