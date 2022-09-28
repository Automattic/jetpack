import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { createElement, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { getSiteAdminUrl } from 'state/initial-state';
import {
	getDetachedLicensesCount,
	getDetachedLicenses,
	getActivationNoticeDismissInfo,
	updateLicensingActivationNoticeDismiss as updateLicensingActivationNoticeDismissAction,
	updateUserLicenses as updateUserLicensesAction,
	getDetachedLicensesLoadingInfo,
} from 'state/licensing';

/**
 * Jetpack "user"-licenses activation notice. (a license key is available for activation)
 *
 * @param {object} props - The properties.
 * @param {number} props.pathname - The path of a URL.
 * @param {number} props.detachedLicensesCount - The user's number of "detached" licenses.
 * @param {Array} props.detachedLicenses -  "detached" licenses.
 * @param {boolean} props.detachedLicensesLoading -  "detached" licenses loading info
 * @param {object} props.activationNoticeDismissInfo - Object containing `last_detached_count` and `last_dismissed_time`.
 * @param {Function} props.updateLicensingActivationNoticeDismiss - Function to update the notification dismiss info.
 * @param {Function} props.updateUserLicenses - Function to update the licenses.
 * @returns {React.Component} The `UserLicenseActivationNotice` component.
 */
const UserLicenseActivationNotice = props => {
	const DAY_IN_MILLISECONDS = 24 * 3600 * 1000;
	const MAX_DAYS_DISMISSED = 14;

	const {
		detachedLicensesCount,
		activationNoticeDismissInfo,
		updateLicensingActivationNoticeDismiss,
		updateUserLicenses,
		pathname,
		siteAdminUrl,
		detachedLicenses,
		detachedLicensesLoading,
	} = props;

	const {
		last_detached_count: lastDetachedCount,
		last_dismissed_time: lastDismissedDateTime,
	} = activationNoticeDismissInfo;

	const USER_LICENSE_ACTIVATION_ROUTE = `${ siteAdminUrl }admin.php?page=jetpack#/license/activation`;

	const userHasDetachedLicenses = !! detachedLicensesCount;
	const userHasNewDetachedLicenses = detachedLicensesCount > ( lastDetachedCount || 0 );

	const now = new Date();
	const lastDismissedTime = new Date( lastDismissedDateTime ? lastDismissedDateTime : new Date() );
	const daysNoticeHasBeenDismissed = ( now - lastDismissedTime ) / DAY_IN_MILLISECONDS;

	const showLicenseActivationNotice =
		userHasDetachedLicenses &&
		( userHasNewDetachedLicenses || daysNoticeHasBeenDismissed > MAX_DAYS_DISMISSED );

	// Send Tracks event on notice 'view'.
	// Only runs once on first render
	useEffect( () => {
		if ( showLicenseActivationNotice ) {
			analytics.tracks.recordEvent( 'jetpack_wpa_licensing_activation_notice_view' );
			// Get licenses if the user has only one license to activate
			if ( detachedLicensesCount === 1 ) {
				updateUserLicenses();
			}
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const trackLicenseActivationClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'licensing_activation_notice',
			page: pathname,
			path: 'licensing/activation',
		} );
	}, [ pathname ] );

	const trackUserPurchasesClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'calypso_purchases_link',
			page: pathname,
		} );
	}, [ pathname ] );

	const onNoticeDismiss = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_wpa_licensing_activation_notice_dismiss' );
		updateLicensingActivationNoticeDismiss();
	}, [ updateLicensingActivationNoticeDismiss ] );

	// Show the notice when the user acquires a new license, Or when the user has an available
	// license(s), but has dismissed the notice and it's been over 2 weeks without activating it.
	if ( showLicenseActivationNotice ) {
		const detachedLicense = detachedLicenses[ 0 ];
		const detachedProduct = detachedLicense && detachedLicense.product;

		// Show the product name if the user has only one license to activate.
		const noticeText =
			detachedLicensesCount === 1 && detachedProduct
				? sprintf(
						/* translators: placeholder is a product name */
						__(
							'Activate %s. <activateLink>Activate it now</activateLink> or <purchasesLink>view all your purchases</purchasesLink>',
							'jetpack'
						),
						detachedProduct
				  )
				: __(
						'You have an available product license key. <activateLink>Activate it now</activateLink> or <purchasesLink>view all your purchases</purchasesLink>',
						'jetpack'
				  );
		if ( detachedLicensesLoading ) {
			return <div className="is-placeholder loading-notice"></div>;
		}
		return (
			<SimpleNotice
				className="jp-license-activation-notice"
				showDismiss={ true }
				onDismissClick={ onNoticeDismiss }
				text={ createInterpolateElement( noticeText, {
					activateLink: createElement( 'a', {
						href: USER_LICENSE_ACTIVATION_ROUTE,
						onClick: trackLicenseActivationClick,
					} ),
					purchasesLink: createElement( ExternalLink, {
						className: 'jp-license-activation-notice__external-link',
						href: getRedirectUrl( 'calypso-purchases' ),
						onClick: trackUserPurchasesClick,
					} ),
				} ) }
			/>
		);
	}
	return null;
};

UserLicenseActivationNotice.propTypes = {
	detachedLicensesCount: PropTypes.number.isRequired,
	activationNoticeDismissInfo: PropTypes.shape( {
		last_detached_count: PropTypes.number,
		last_dismiss_time: PropTypes.string,
	} ),
	pathname: PropTypes.string.isRequired,
	siteAdminUrl: PropTypes.string.isRequired,
	detachedLicenses: PropTypes.array.isRequired,
};

UserLicenseActivationNotice.defaultProps = {
	activationNoticeDismissInfo: {
		last_detached_count: null,
		last_dismiss_time: null,
	},
};

export default connect(
	state => {
		return {
			detachedLicensesCount: getDetachedLicensesCount( state ),
			activationNoticeDismissInfo: getActivationNoticeDismissInfo( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			detachedLicenses: getDetachedLicenses( state ),
			detachedLicensesLoading: getDetachedLicensesLoadingInfo( state ),
		};
	},
	dispatch => {
		return {
			updateLicensingActivationNoticeDismiss: () => {
				return dispatch( updateLicensingActivationNoticeDismissAction() );
			},
			updateUserLicenses: () => {
				return dispatch( updateUserLicensesAction() );
			},
		};
	}
)( UserLicenseActivationNotice );
