import { UpsellBanner, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import jetpackManageIcon from './jetpack-manage.svg';

/**
 * Jetpack Manager Banner component that renders a banner with CTAs.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isAgencyAccount - Whether users account is an Agency account or not.
 * @returns {object} The JetpackManageBanner component.
 */
const JetpackManageBanner = props => {
	// eslint-disable-next-line no-unused-vars
	const { isAgencyAccount = false } = props;
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
	const handleAgencyInterestClick = useCallback( () => {
		trackClick( 'jp-agencies-register-interest' );
	}, [ trackClick ] );

	return (
		<UpsellBanner
			icon={ jetpackManageIcon }
			title={ __( 'Manage client sites and grow your business', 'jetpack-my-jetpack' ) }
			description={ __(
				'Are you an agency or freelancer? We’re working on a new partnership program bringing together the best of Jetpack, Woo, WordPress.com, and Pressable. Get bulk discounts, referral commissions, and more.',
				'jetpack-my-jetpack'
			) }
			primaryCtaLabel={ __( 'Sign up now', 'jetpack-my-jetpack' ) }
			primaryCtaURL={ getRedirectUrl( 'jetpack-for-agencies-register-interest' ) }
			primaryCtaIsExternalLink={ true }
			primaryCtaOnClick={ handleAgencyInterestClick }
		/>
	);
};

export default JetpackManageBanner;
