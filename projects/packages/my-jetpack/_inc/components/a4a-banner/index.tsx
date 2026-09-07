import { UpsellBanner, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import useDismissA4ABanner from '../../data/use-dismiss-a4a-banner';
import useAnalytics from '../../hooks/use-analytics';
import icon from './icon.svg';

/**
 * Automattic for Agencies Banner component that renders a banner with CTAs.
 *
 * @param {object}  props                 - Component props.
 * @param {boolean} props.isAgencyAccount - Whether users account is an Agency account or not.
 * @return The rendered component.
 */
const A4ABanner = props => {
	const { isAgencyAccount = false } = props;
	const { recordEvent } = useAnalytics();
	const { dismiss } = useDismissA4ABanner();
	// Hide the banner right away on dismissal; the request only persists that across page loads.
	const [ isDismissed, setIsDismissed ] = useState( false );

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

	// Handle the banner being dismissed.
	const handleDismiss = useCallback( () => {
		setIsDismissed( true );
		recordEvent( 'jetpack_myjetpack_manage_banner_dismiss', {
			feature: 'manage',
		} );
		dismiss();
	}, [ dismiss, recordEvent ] );

	if ( isAgencyAccount || isDismissed ) {
		return null;
	}

	return (
		<UpsellBanner
			icon={ icon }
			title={ __( 'Are you an agency or freelancer?', 'jetpack-my-jetpack' ) }
			description={ __(
				'Automattic for Agencies is the ultimate partnership to access agency pricing, referral earnings, partner badges, and powerful tooling for agencies using WordPress.com, Pressable, WooCommerce, Jetpack, and more. Joining is free.',
				'jetpack-my-jetpack'
			) }
			primaryCtaLabel={ __( 'Sign up now', 'jetpack-my-jetpack' ) }
			primaryCtaURL={ getRedirectUrl( 'jetpack-for-agencies-register-interest' ) }
			primaryCtaIsExternalLink={ true }
			primaryCtaOnClick={ handleAgencyInterestClick }
			onDismiss={ handleDismiss }
			dismissLabel={ __( 'Dismiss the Automattic for Agencies banner', 'jetpack-my-jetpack' ) }
		/>
	);
};

export default A4ABanner;
