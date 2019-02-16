/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus, isCurrentUserLinked, isDevMode } from 'state/connection';
import {
	userIsMaster,
	getUserWpComLogin,
	getUserWpComEmail,
	getUserWpComAvatar,
	getUsername,
} from 'state/initial-state';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';
import { createNotice } from 'state/notices/actions';

/**
 * These should ultimately be in their own state/* file
 */

import restApi from 'rest-api';
import {
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH,
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
} from 'state/action-types';

/**
 * Not used yet, but ultimately should be used to determine whether to show prompt to send login email
 */
const checkIsMobileUser = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH,
		} );
		return restApi
			.fetchIsMobileUser()
			.then( data => {
				if ( data.errors && data.errors.length > 0 ) {
					const errorCode = Object.keys( data.errors )[ 0 ];
					const errorMessage = data.errors[ errorCode ];
					dispatch( {
						type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
						error: {
							code: errorCode,
							message: errorMessage,
						},
					} );
					return data;
				}

				dispatch( {
					type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_SUCCESS,
					isMobileUser: data, // TODO: indicate android, iOS, etc? Maybe not useful
				} );

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
					error: error.response,
				} );

				dispatch(
					createNotice(
						'is-error',
						__( 'Failed to check mobile user status: %(error)', {
							args: {
								error: error.response.message,
							},
						} ),
						{ id: 'mobile-check-is-user' }
					)
				);
			} );
	};
};

const sendMobileLoginEmail = keyringId => {
	return dispatch => {
		console.warn( 'sending mobile login email action' );
		dispatch( {
			type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
		} );
		return restApi
			.sendMobileLoginEmail( keyringId )
			.then( data => {
				if ( data.errors && data.errors.length > 0 ) {
					const errorCode = Object.keys( data.errors )[ 0 ];
					const errorMessage = data.errors[ errorCode ];
					dispatch( {
						type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
						error: {
							code: errorCode,
							message: errorMessage,
						},
					} );
					return data;
				}

				dispatch( {
					type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
				} );

				dispatch(
					createNotice( 'is-success', __( 'Login email sent' ), {
						id: 'mobile-sent-login-email',
						duration: 2000,
					} )
				);

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
					error: error.response,
				} );

				dispatch(
					createNotice(
						'is-error',
						__( 'Failed to send login email: %(error)', {
							args: {
								error: error.response.message,
							},
						} ),
						{ id: 'mobile-check-is-user' }
					)
				);
			} );
	};
};

export class DashMobileLogin extends Component {
	/*
	 * Render a card for user linking. If it's connected, show the currently linked user.
	 * Show an alternative message if site is in Dev Mode.
	 *
	 * @returns {string}
	 */
	mobileAppLogin() {
		let cardContent = '';

		if ( this.props.isDevMode ) {
			// return nothing if this is an account connection card
			cardContent = (
				<div className="jp-connection-settings__info">
					<img
						alt="gravatar"
						width="64"
						height="64"
						className="jp-connection-settings__gravatar"
						src={ this.props.userWpComAvatar }
					/>
					<div className="jp-connection-settings__text">
						{ __(
							'The site is in Development Mode, so you can not auto-login to our mobile apps.'
						) }
					</div>
				</div>
			);
		} else {
			cardContent = this.props.isLinked ? (
				<div>
					<div className="jp-connection-settings__info">
						<img
							alt="gravatar"
							width="64"
							height="64"
							className="jp-connection-settings__gravatar"
							src={ this.props.userWpComAvatar }
						/>
						<div className="jp-connection-settings__text">
							{ __( 'Connected as {{span}}%(username)s{{/span}}', {
								args: {
									username: this.props.userWpComLogin,
								},
								components: {
									span: <span className="jp-connection-settings__username" />,
								},
								comment: '%(username) is the WordPress user login name.',
							} ) }
							<div className="jp-connection-settings__email">{ this.props.userWpComEmail }</div>
							<a href="#" onClick={ this.clickSendLoginEmail }>
								Send me an email that logs me in
							</a>
						</div>
					</div>
				</div>
			) : (
				<div>
					<div className="jp-connection-settings__info">
						{ __( 'Link your account to WordPress.com to get easy access to our mobile apps.' ) }
					</div>
					<div className="jp-connection-settings__actions">
						<ConnectButton asLink connectUser={ true } from="connection-settings" />
					</div>
				</div>
			);
		}

		return cardContent;
	}

	clickSendLoginEmail = e => {
		e.preventDefault();

		console.warn( 'clicked this thing' );

		this.props.sendMobileLoginEmail();
	};

	render() {
		return (
			<div>
				<QueryUserConnectionData />
				<div className="jp-at-a-glance__item-grid">
					<div className="jp-at-a-glance__left">
						<div className="jp-dash-item__interior">
							<DashItem
								className="jp-connection-type"
								label={ __( 'Mobile app', { context: 'Dashboard widget header' } ) }
							>
								{ this.mobileAppLogin() }
							</DashItem>
						</div>
					</div>
					<div className="jp-at-a-glance__right">
						<div className="jp-dash-item__interior">Nothing to see here</div>
					</div>
				</div>
			</div>
		);
	}
}

DashMobileLogin.propTypes = {
	siteConnectionStatus: PropTypes.any.isRequired,
	isDevMode: PropTypes.bool.isRequired,
	userIsMaster: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	userWpComLogin: PropTypes.any.isRequired,
	userWpComEmail: PropTypes.any.isRequired,
	userWpComAvatar: PropTypes.any.isRequired,
	username: PropTypes.any.isRequired,
};

export default connect(
	state => {
		return {
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isDevMode: isDevMode( state ),
			userIsMaster: userIsMaster( state ),
			userWpComLogin: getUserWpComLogin( state ),
			userWpComEmail: getUserWpComEmail( state ),
			userWpComAvatar: getUserWpComAvatar( state ),
			username: getUsername( state ),
			isLinked: isCurrentUserLinked( state ),
		};
	},
	{
		checkIsMobileUser,
		sendMobileLoginEmail,
	}
)( DashMobileLogin );
