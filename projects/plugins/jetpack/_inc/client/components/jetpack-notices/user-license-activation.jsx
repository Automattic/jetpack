/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
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
		// TODO: Update this link to point to the user-licensing activation route.
		const USER_LICENSE_ACTIVATION_ROUTE = '/wp-admin/admin.php?page=jetpack#/my-plan';
		const MAX_DISMISS_TIME = [ 2, 'weeks' ];

		const {
			detachedLicensesCount: currentDetachedCount,
			updateLicensingActivationNoticeDismiss,
		} = this.props;

		const {
			last_detached_count: lastDetachedCount,
			last_dismissed_time: lastDismissedDateTime,
		} = this.props.activationNoticeDismissInfo;

		const now = moment();
		const lastDismissedTime = moment( lastDismissedDateTime ? lastDismissedDateTime : moment() );
		const userHasDetachedLicenses = !! currentDetachedCount;
		const userHasNewDetachedLicenses = currentDetachedCount > ( lastDetachedCount || 0 );
		const hasBeenDismissedMoreThanTwoWeeks = lastDismissedTime
			.add( ...MAX_DISMISS_TIME )
			.isSameOrBefore( now );

		// Show the notice when the user acquires a new license, Or when the user has an available
		// license(s), but has dismissed the notice and it's been over 2 weeks without activating it.
		if (
			userHasDetachedLicenses &&
			( userHasNewDetachedLicenses || hasBeenDismissedMoreThanTwoWeeks )
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
