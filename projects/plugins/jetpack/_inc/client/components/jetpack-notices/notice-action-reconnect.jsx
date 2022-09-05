import { useRestoreConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import NoticeAction from 'components/notice/notice-action';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import {
	CONNECT_URL_FETCH_SUCCESS,
	SITE_RECONNECT,
	SITE_RECONNECT_FAIL,
	UNLINK_USER_SUCCESS,
} from 'state/action-types';
import { isReconnectingSite, connectUser } from 'state/connection';

const NoticeActionReconnect = props => {
	const { restoreConnection } = useRestoreConnection();

	const getEventProps = useCallback( () => {
		const eventProps = {
			location: 'dashboard',
			purpose: 'reconnect',
		};

		if ( props.errorCode ) {
			eventProps.error_code = props.errorCode;
		}

		if ( props.errorData ) {
			if ( props.errorData.api_error_code ) {
				eventProps.api_error_code = props.errorData.api_error_code;
			}
			if ( props.errorData.api_http_code ) {
				eventProps.api_http_code = props.errorData.api_http_code;
			}
		}

		return eventProps;
	}, [ props.errorCode, props.errorData ] );

	const handleDisconnectClick = useCallback( () => {
		// Reconnection already in progress
		if ( props.isReconnectingSite ) {
			return;
		}

		analytics.tracks.recordEvent( 'jetpack_termination_error_notice_click', getEventProps() );
		doReconnect();
	}, [ props.isReconnectingSite, getEventProps, doReconnect ] );

	/**
	 * Initiate the restore connection process.
	 *
	 * @returns {Promise} - The API request promise.
	 */
	const doReconnect = useCallback( () => {
		props.beforeReconnectSite();

		return restoreConnection( false )
			.then( connectionStatusData => {
				// Status 'in_progress' means the user needs to re-connect their WP.com account.
				// The hook can redirect us to "My Jetpack" to do that, but we'll do it the Jetpack-the-plugin way.
				if ( 'in_progress' === connectionStatusData.status ) {
					props.initiateUserConnection( connectionStatusData.authorizeUrl );
				}
			} )
			.catch( error => props.reconnectFailed( error ) );
	}, [ props, restoreConnection ] );

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_termination_error_notice_view', getEventProps() );
	}, [ getEventProps ] );

	return (
		<NoticeAction icon={ props.icon } onClick={ handleDisconnectClick }>
			{ props.children }
		</NoticeAction>
	);
};

NoticeActionReconnect.propTypes = {
	icon: PropTypes.string,
	errorCode: PropTypes.string,
	errorData: PropTypes.object,
	action: PropTypes.string,
};

export default connect(
	state => {
		return {
			isReconnectingSite: isReconnectingSite( state ),
		};
	},
	dispatch => {
		return {
			beforeReconnectSite: () => {
				dispatch( {
					type: SITE_RECONNECT,
				} );
				dispatch(
					createNotice( 'is-info', __( 'Reconnecting Jetpack', 'jetpack' ), {
						id: 'reconnect-jetpack',
					} )
				);
			},
			initiateUserConnection: authorizeUrl => {
				dispatch( { type: UNLINK_USER_SUCCESS } );

				// Set connectUrl and initiate the connection flow.
				dispatch( {
					type: CONNECT_URL_FETCH_SUCCESS,
					connectUrl: authorizeUrl,
				} );
				dispatch( connectUser() );
			},
			reconnectFailed: error => {
				dispatch( {
					type: SITE_RECONNECT_FAIL,
					error: error,
				} );
				dispatch( removeNotice( 'reconnect-jetpack' ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: placeholder is the error. */
							__( 'There was an error reconnecting Jetpack. Error: %s', 'jetpack' ),
							error.response.message || error.response.code
						),
						{ id: 'reconnect-jetpack' }
					)
				);
			},
		};
	}
)( NoticeActionReconnect );
