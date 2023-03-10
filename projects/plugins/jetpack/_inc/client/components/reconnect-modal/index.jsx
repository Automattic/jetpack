import { useRestoreConnection } from '@automattic/jetpack-connection';
import { __, _x, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import Card from 'components/card';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import Modal from 'components/modal';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
	CONNECT_URL_FETCH_SUCCESS,
	SITE_RECONNECT,
	SITE_RECONNECT_FAIL,
	UNLINK_USER_SUCCESS,
} from 'state/action-types';
import { isSiteConnected, isReconnectingSite, connectUser } from 'state/connection';

import './style.scss';

/**
 * The "Reconnect" modal component.
 *
 * @param {object} props - The properties.
 * @returns {React.ReactElement} The modal.
 */
export function ReconnectModal( props ) {
	const {
		show,
		onHide,
		isSiteConnected: isSiteConnectedProp,
		isReconnectingSite: isReconnectingSiteProp,
		beforeReconnectSite: beforeReconnectSiteProp,
		initiateUserConnection: initiateUserConnectionProp,
		reconnectFailed: reconnectFailedProp,
		clickReconnectSite: clickReconnectSiteProp,
	} = props;

	const shouldShowModal = useCallback( () => {
		return show && isSiteConnectedProp && ! isReconnectingSiteProp;
	}, [ show, isSiteConnectedProp, isReconnectingSiteProp ] );

	const closeModal = useCallback( () => {
		onHide && onHide();
	}, [ onHide ] );

	const { restoreConnection } = useRestoreConnection();

	const clickReconnectSite = useCallback(
		e => {
			e.preventDefault();
			analytics.tracks.recordJetpackClick( 'confirm_reconnect_modal' );

			beforeReconnectSiteProp();

			restoreConnection( false )
				.then( connectionStatusData => {
					// Status 'in_progress' means the user needs to re-connect their WP.com account.
					// The hook can redirect us to "My Jetpack" to do that, but we'll do it the Jetpack-the-plugin way.
					if ( 'in_progress' === connectionStatusData.status ) {
						initiateUserConnectionProp( connectionStatusData.authorizeUrl );
					}
				} )
				.catch( error => reconnectFailedProp( error ) );

			closeModal();
		},
		[
			beforeReconnectSiteProp,
			initiateUserConnectionProp,
			reconnectFailedProp,
			restoreConnection,
			closeModal,
		]
	);

	return (
		shouldShowModal() && (
			<Modal className="reconnect__modal" onRequestClose={ closeModal }>
				<Card className="reconnect__modal__body">
					<h2>{ __( 'Reconnect Jetpack', 'jetpack' ) }</h2>
					<h4>{ __( 'You’ve clicked a link to restore your Jetpack connection.', 'jetpack' ) }</h4>
					<h4>
						<strong>
							{ __(
								'You should only do this if advised by Site Health tests or Jetpack Support.',
								'jetpack'
							) }
						</strong>
					</h4>
					<h4>{ __( 'Click below to reconnect Jetpack', 'jetpack' ) }</h4>
					<div className="reconnect__modal-actions">
						<Button className="reconnect__modal-cancel" onClick={ closeModal }>
							{ _x( 'Cancel', 'A caption for a button to cancel an action.', 'jetpack' ) }
						</Button>
						<Button
							className="reconnect__modal-reconnect"
							onClick={ clickReconnectSiteProp || clickReconnectSite }
							primary
						>
							{ _x(
								'Reconnect Jetpack',
								'A caption for a button to reconnect Jetpack.',
								'jetpack'
							) }
						</Button>
					</div>
				</Card>
			</Modal>
		)
	);
}

ReconnectModal.displayName = 'ReconnectModal';

ReconnectModal.propTypes = {
	show: PropTypes.bool,
	onHide: PropTypes.func,
	clickReconnectSite: PropTypes.func,
};

ReconnectModal.defaultProps = {
	show: false,
};

export default connect(
	state => {
		return {
			isSiteConnected: isSiteConnected( state ),
			isReconnectingSite: isReconnectingSite( state ),
		};
	},
	dispatch => ( {
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
	} )
)( ReconnectModal );
