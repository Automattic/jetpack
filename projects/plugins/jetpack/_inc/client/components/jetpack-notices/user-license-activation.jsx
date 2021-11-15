/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { createElement, useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getSiteAdminUrl } from 'state/initial-state';
import {
	getDetachedLicensesCount,
	getActivationNoticeDismissInfo,
	updateLicensingActivationNoticeDismiss as updateLicensingActivationNoticeDismissAction,
} from 'state/licensing';
import SimpleNotice from 'components/notice';

/**
 * Jetpack "user"-licenses activation notice. (a license key is available for activation)
 *
 * @param {object} props - The properties.
 * @param {number} props.detachedLicensesCount - The user's number of "detached" licenses.
 * @param {object} props.activationNoticeDismissInfo - Object containing `last_detached_count` and `last_dismissed_time`.
 * @param {Function} props.updateLicensingActivationNoticeDismiss - Function to update the notification dismiss info.
 * @returns {React.Component} The `UserLicenseActivationNotice` component.
 */
const UserLicenseActivationNotice = props => {
	const DAY_IN_MILLISECONDS = 24 * 3600 * 1000;
	const MAX_DAYS_DISMISSED = 14;

	const {
		detachedLicensesCount,
		activationNoticeDismissInfo,
		updateLicensingActivationNoticeDismiss,
		siteAdminUrl,
	} = props;

	const {
		last_detached_count: lastDetachedCount,
		last_dismissed_time: lastDismissedDateTime,
	} = activationNoticeDismissInfo;

	// TODO: Update this link to point to the user-license activation route.
	const USER_LICENSE_ACTIVATION_ROUTE = `${ siteAdminUrl }admin.php?page=jetpack#/my-plan`;

	const userHasDetachedLicenses = !! detachedLicensesCount;
	const userHasNewDetachedLicenses = detachedLicensesCount > ( lastDetachedCount || 0 );

	const now = new Date();
	const lastDismissedTime = new Date( lastDismissedDateTime ? lastDismissedDateTime : new Date() );
	const daysNoticeHasBeenDismissed = ( now - lastDismissedTime ) / DAY_IN_MILLISECONDS;

	// Send Tracks event on notice 'view'.
	// Only runs once on first render
	useEffect( () => {
		if (
			userHasDetachedLicenses &&
			( userHasNewDetachedLicenses || daysNoticeHasBeenDismissed > MAX_DAYS_DISMISSED )
		) {
			analytics.tracks.recordEvent( 'jetpack_wpa_licensing_activation_notice_view' );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const trackClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'licensing_activation_notice',
			path: 'licensing/activation',
		} );
	}, [] );

	const onNoticeDismiss = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_wpa_licensing_activation_notice_dismiss' );
		updateLicensingActivationNoticeDismiss();
	}, [ updateLicensingActivationNoticeDismiss ] );

	// Show the notice when the user acquires a new license, Or when the user has an available
	// license(s), but has dismissed the notice and it's been over 2 weeks without activating it.
	if (
		userHasDetachedLicenses &&
		( userHasNewDetachedLicenses || daysNoticeHasBeenDismissed > MAX_DAYS_DISMISSED )
	) {
		return (
			<SimpleNotice
				className="jp-license-activation-notice"
				showDismiss={ true }
				onDismissClick={ onNoticeDismiss }
				text={ createInterpolateElement(
					__( 'You have an inactive product. <a>Activate now</a>', 'jetpack' ),
					{
						a: createElement( 'a', {
							href: USER_LICENSE_ACTIVATION_ROUTE,
							onClick: trackClick,
						} ),
					}
				) }
			/>
		);
	}
	return null;
};

UserLicenseActivationNotice.propTypes = {
	detachedLicensesCount: PropTypes.number.isRequired,
	activationNoticeDismissInfo: PropTypes.shape( {
		last_detached_count: PropTypes.number.isRequired,
		last_dismiss_time: PropTypes.string.isRequired,
	} ),
	siteAdminUrl: PropTypes.string.isRequired,
};

export default connect(
	state => {
		return {
			detachedLicensesCount: getDetachedLicensesCount( state ),
			activationNoticeDismissInfo: getActivationNoticeDismissInfo( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
		};
	},
	dispatch => {
		return {
			updateLicensingActivationNoticeDismiss: () => {
				return dispatch( updateLicensingActivationNoticeDismissAction() );
			},
		};
	}
)( UserLicenseActivationNotice );
