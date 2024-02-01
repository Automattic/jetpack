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

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_manage_banner_view' );
	}, [ recordEvent ] );

	// Handle click events
	const bannerClickHandler = useCallback(
		target => {
			recordEvent( 'jetpack_myjetpack_manage_banner_click', {
				target: target,
				feature: 'manage',
			} );
		},
		[ recordEvent ]
	);

	const learnMoreClick = useCallback( () => {
		bannerClickHandler( 'jp-manage-learn-more' );
	}, [ bannerClickHandler ] );
	const dashboardSitesClick = useCallback( () => {
		bannerClickHandler( 'jp-manage-dashboard-sites' );
	}, [ bannerClickHandler ] );
	const signUpClick = useCallback( () => {
		bannerClickHandler( 'jp-manage-sign-up' );
	}, [ bannerClickHandler ] );

	// Set up the secondary CTA
	const secondaryCtaLabel = __( 'Learn more', 'jetpack-my-jetpack' );
	const secondaryCtaURL = getRedirectUrl( 'my-jetpack-jetpack-manage-learn-more' );

	// Set up the primary CTA
	let primaryCtaLabel, primaryCtaURL, primaryCtaOnClick;

	if ( isAgencyAccount ) {
		primaryCtaLabel = __( 'Manage sites', 'jetpack-my-jetpack' );
		primaryCtaURL = getRedirectUrl( 'my-jetpack-jetpack-manage-dashboard' );
		primaryCtaOnClick = dashboardSitesClick;
	} else {
		primaryCtaLabel = __( 'Sign up for free', 'jetpack-my-jetpack' );
		primaryCtaURL = getRedirectUrl( 'my-jetpack-jetpack-manage-sign-up' );
		primaryCtaOnClick = signUpClick;
	}

	return (
		<UpsellBanner
			icon={ jetpackManageIcon }
			title={ __( 'Jetpack Manage', 'jetpack-my-jetpack' ) }
			description={ __(
				'Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention. Plus, get bulk discounts.',
				'jetpack-my-jetpack'
			) }
			secondaryCtaLabel={ secondaryCtaLabel }
			secondaryCtaURL={ secondaryCtaURL }
			secondaryCtaIsExternalLink={ true }
			secondaryCtaOnClick={ learnMoreClick }
			primaryCtaLabel={ primaryCtaLabel }
			primaryCtaURL={ primaryCtaURL }
			primaryCtaIsExternalLink={ true }
			primaryCtaOnClick={ primaryCtaOnClick }
		/>
	);
};

export default JetpackManageBanner;
