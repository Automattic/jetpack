/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import {
	getDetachedLicensesCount,
	getActivationNoticeDismissInfo,
	updateLicensingActivationNoticeDismiss as updateLicensingActivationNoticeDismissAction,
} from 'state/licensing';
import SimpleNotice from 'components/notice';

class UserLicenseActivationNotice extends React.Component {
	static propTypes = {
		detachedLicensesCount: PropTypes.number.isRequired,
		activationNoticeDismissInfo: PropTypes.shape( {
			last_detached_count: PropTypes.number,
			last_dismiss_time: PropTypes.string,
		} ),
	};

	trackClick = () => {
		analytics.tracks.recordJetpackClick( 'activate-user-license' );
	};

	render() {
		// TODO: Update this link to point to the user-license activation route.
		const USER_LICENSE_ACTIVATION_ROUTE = '/wp-admin/admin.php?page=jetpack#/my-plan';
		const DAY_IN_MILLISECONDS = 24 * 3600 * 1000;
		const MAX_DAYS_DISMISSED = 14;

		const {
			detachedLicensesCount: currentDetachedCount,
			updateLicensingActivationNoticeDismiss,
		} = this.props;

		const {
			last_detached_count: lastDetachedCount,
			last_dismissed_time: lastDismissedDateTime,
		} = this.props.activationNoticeDismissInfo;

		const userHasDetachedLicenses = !! currentDetachedCount;
		const userHasNewDetachedLicenses = currentDetachedCount > ( lastDetachedCount || 0 );

		const now = new Date();
		const lastDismissedTime = new Date(
			lastDismissedDateTime ? lastDismissedDateTime : new Date()
		);
		const daysNoticeHasBeenDismissed = ( now - lastDismissedTime ) / DAY_IN_MILLISECONDS;

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
					onDismissClick={ updateLicensingActivationNoticeDismiss }
					text={ createInterpolateElement(
						__( 'You have an inactive product. <a>Activate now</a>', 'jetpack' ),
						{
							a: (
								<a href={ USER_LICENSE_ACTIVATION_ROUTE } onClick={ this.trackClick }>
									{ this.props.children }
								</a>
							),
						}
					) }
				/>
			);
		}
		return false;
	}
}

export default connect(
	state => {
		return {
			detachedLicensesCount: getDetachedLicensesCount( state ),
			activationNoticeDismissInfo: getActivationNoticeDismissInfo( state ),
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
