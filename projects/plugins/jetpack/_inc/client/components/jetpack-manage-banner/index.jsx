import { getRedirectUrl, UpsellBanner } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import jetpackManageIcon from './jetpack-manage.svg';

const JetpackManageBanner = props => {
	const trackEvent = useCallback(
		target => {
			analytics.tracks.recordJetpackClick( {
				target: target,
				feature: 'agencies',
				page: props.path,
				is_user_wpcom_connected: props.isUserLinked ? 'yes' : 'no',
				is_connection_owner: props.isOwner ? 'yes' : 'no',
			} );
		},
		[ props.path, props.isUserLinked, props.isOwner ]
	);

	const handleLearnMoreClick = useCallback( () => {
		trackEvent( 'jp-manage-learn-more-click' );
	}, [ trackEvent ] );

	const handleManageSitesClick = useCallback( () => {
		trackEvent( 'jp-manage-sites-click' );
	}, [ trackEvent ] );

	const handleSignUpForFreeClick = useCallback( () => {
		trackEvent( 'jp-manage-sign-up' );
	}, [ trackEvent ] );

	const redirectOrigin = 'jetpack-at-a-glance';

	// Set up the first CTA
	const ctaLearnMoreLabel = __( 'Learn more', 'jetpack' );
	const ctaLearnMoreUrl = getRedirectUrl( `${ redirectOrigin }-to-jetpack-manage-learn-more` );

	// Set up the second CTA
	const ctaManageSitesLabel = __( 'Manage sites', 'jetpack' );
	const ctaManageSitesUrl = getRedirectUrl( `${ redirectOrigin }-to-jetpack-manage-dashboard` );

	const ctaSignUpForFreeLabel = __( 'Sign up for free', 'jetpack' );
	const ctaSignUpForFreeUrl = getRedirectUrl( `${ redirectOrigin }-to-jetpack-manage-sign-up` );

	return (
		<UpsellBanner
			icon={ jetpackManageIcon }
			title={ __( "Manage your clients' sites with ease", 'jetpack' ) }
			description={ __(
				'Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention. Plus, get bulk discounts.',
				'jetpack'
			) }
			secondaryCtaLabel={ ctaLearnMoreLabel }
			secondaryCtaURL={ ctaLearnMoreUrl }
			secondaryCtaIsExternalLink={ true }
			secondaryCtaOnClick={ handleLearnMoreClick }
			primaryCtaLabel={ props.isAgencyAccount ? ctaManageSitesLabel : ctaSignUpForFreeLabel }
			primaryCtaURL={ props.isAgencyAccount ? ctaManageSitesUrl : ctaSignUpForFreeUrl }
			primaryCtaIsExternalLink={ true }
			primaryCtaOnClick={
				props.isAgencyAccount ? handleManageSitesClick : handleSignUpForFreeClick
			}
		/>
	);
};

JetpackManageBanner.propTypes = {
	path: PropTypes.string,
	isUserLinked: PropTypes.bool,
	isOwner: PropTypes.bool,
	isFetchingData: PropTypes.bool,
	isAgencyAccount: PropTypes.bool,
};

JetpackManageBanner.defaultProps = {
	path: '',
	isUserLinked: false,
	isOwner: false,
	isFetchingData: false,
	isAgencyAccount: false,
};

export default JetpackManageBanner;
