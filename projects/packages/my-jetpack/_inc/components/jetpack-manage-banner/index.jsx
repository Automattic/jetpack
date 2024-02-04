import { UpsellBanner, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import jetpackManageIcon from './jetpack-manage.svg';

/**
 * Jetpack Manager Banner component that renders a banner with CTAs.
 *
 * @param {object} props - Component props.
 * @returns {object} The JetpackManageBanner component.
 */
const JetpackManageBanner = props => {
	const { isAgencyAccount } = props;
	const { recordEvent } = useAnalytics();

	// Track banner view.
	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_manage_banner_view', {} );
	}, [ recordEvent ] );

	// Track click event.
	const trackClick = useCallback(
		target => {
			recordEvent( 'jetpack_myjetpack_manage_banner_click', {
				target: target,
				feature: 'manage',
			} );
		},
		[ recordEvent ]
	);

	// Handle CTA banner clicks.
	const handleLearnMoreClick = useCallback( () => {
		trackClick( 'jp-manage-learn-more' );
	}, [ trackClick ] );
	const handleDashboardSitesClick = useCallback( () => {
		trackClick( 'jp-manage-dashboard-sites' );
	}, [ trackClick ] );
	const handleSignUpClick = useCallback( () => {
		trackClick( 'jp-manage-sign-up' );
	}, [ trackClick ] );

	// Set up the primary CTA.
	let primaryCtaLabel, primaryCtaURL, primaryCtaOnClick;

	if ( isAgencyAccount ) {
		primaryCtaLabel = __( 'Manage sites', 'jetpack-my-jetpack' );
		primaryCtaURL = getRedirectUrl( 'my-jetpack-jetpack-manage-dashboard' );
		primaryCtaOnClick = handleDashboardSitesClick;
	} else {
		primaryCtaLabel = __( 'Sign up for free', 'jetpack-my-jetpack' );
		primaryCtaURL = getRedirectUrl( 'my-jetpack-jetpack-manage-sign-up' );
		primaryCtaOnClick = handleSignUpClick;
	}

	return (
		<UpsellBanner
			icon={ jetpackManageIcon }
			title={ __( 'Jetpack Manage', 'jetpack-my-jetpack' ) }
			description={ __(
				'Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention. Plus, get bulk discounts.',
				'jetpack-my-jetpack'
			) }
			secondaryCtaLabel={ __( 'Learn more', 'jetpack-my-jetpack' ) }
			secondaryCtaURL={ getRedirectUrl( 'my-jetpack-jetpack-manage-learn-more' ) }
			secondaryCtaIsExternalLink={ true }
			secondaryCtaOnClick={ handleLearnMoreClick }
			primaryCtaLabel={ primaryCtaLabel }
			primaryCtaURL={ primaryCtaURL }
			primaryCtaIsExternalLink={ true }
			primaryCtaOnClick={ primaryCtaOnClick }
		/>
	);
};

export default JetpackManageBanner;
