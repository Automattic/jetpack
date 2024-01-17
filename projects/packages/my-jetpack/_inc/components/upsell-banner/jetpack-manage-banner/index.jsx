import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import UpsellBanner from '../';
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
	const cta1Label = __( 'Learn more', 'jetpack-my-jetpack' );
	const cta1WithIcon = true;
	const cta1URL = getRedirectUrl( 'my-jetpack-jetpack-manage-learn-more' );

	const manageSitesBtnLabel = __( 'Manage sites', 'jetpack-my-jetpack' );
	const signUpForFreeBtnLabel = __( 'Sign up for free', 'jetpack-my-jetpack' );

	// Set up the second CTA
	const cta2Label = isAgencyAccount ? manageSitesBtnLabel : signUpForFreeBtnLabel;
	const cta2WithIcon = true;
	const cta2URL = isAgencyAccount
		? getRedirectUrl( 'my-jetpack-jetpack-manage-dashboard' )
		: getRedirectUrl( 'my-jetpack-jetpack-manage-sign-up' );

	return (
		<UpsellBanner
			icon={ jetpackManageIcon }
			title={ __( 'Jetpack Manage', 'jetpack-my-jetpack' ) }
			description={ __(
				'Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention.',
				'jetpack-my-jetpack'
			) }
			cta1Label={ cta1Label }
			cta1WithIcon={ cta1WithIcon }
			cta1URL={ cta1URL }
			cta2Label={ cta2Label }
			cta2WithIcon={ cta2WithIcon }
			cta2URL={ cta2URL }
		/>
	);
};

export default JetpackManageBanner;
