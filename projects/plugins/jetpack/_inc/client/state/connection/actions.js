import restApi from '@automattic/jetpack-api';
import { useRestoreConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import {
	JETPACK_CONNECTION_STATUS_FETCH,
	JETPACK_CONNECTION_TEST_FETCH,
	CONNECT_URL_FETCH,
	CONNECT_URL_FETCH_FAIL,
	CONNECT_URL_FETCH_SUCCESS,
	USER_CONNECTION_DATA_FETCH,
	USER_CONNECTION_DATA_FETCH_FAIL,
	USER_CONNECTION_DATA_FETCH_SUCCESS,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS,
	CONNECT_USER,
	RESET_CONNECT_USER,
	UNLINK_USER,
	UNLINK_USER_FAIL,
	UNLINK_USER_SUCCESS,
	SITE_RECONNECT,
	SITE_RECONNECT_FAIL,
	JETPACK_CONNECTION_HAS_SEEN_WC_CONNECTION_MODAL,
} from 'state/action-types';

export const fetchSiteConnectionStatus = () => {
	return dispatch => {
		return restApi.fetchSiteConnectionStatus().then( siteConnected => {
			dispatch( {
				type: JETPACK_CONNECTION_STATUS_FETCH,
				siteConnected: siteConnected,
			} );
		} );
	};
};

export const fetchSiteConnectionTest = () => {
	return dispatch => {
		dispatch(
			createNotice( 'is-info', __( 'Testing Jetpack Connection', 'jetpack' ), {
				id: 'test-jetpack-connection',
			} )
		);
		return restApi
			.fetchSiteConnectionTest()
			.then( connectionTest => {
				dispatch( {
					type: JETPACK_CONNECTION_TEST_FETCH,
					connectionTest: connectionTest,
				} );
				dispatch( removeNotice( 'test-jetpack-connection' ) );
				dispatch(
					createNotice(
						connectionTest.code === 'success' ? 'is-success' : 'is-error',
						connectionTest.message,
						{ id: 'test-jetpack-connection' }
					)
				);
			} )
			.catch( error => {
				dispatch( removeNotice( 'test-jetpack-connection' ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: placeholder is an error message. */
							__( 'There was an error testing Jetpack. Error: %s', 'jetpack' ),
							error.message
						),
						{ id: 'test-jetpack-connection' }
					)
				);
			} );
	};
};

export const fetchConnectUrl = () => {
	return dispatch => {
		dispatch( {
			type: CONNECT_URL_FETCH,
		} );
		return restApi
			.fetchConnectUrl()
			.then( connectUrl => {
				dispatch( {
					type: CONNECT_URL_FETCH_SUCCESS,
					connectUrl: connectUrl,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: CONNECT_URL_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchUserConnectionData = () => {
	return dispatch => {
		dispatch( {
			type: USER_CONNECTION_DATA_FETCH,
		} );
		return restApi
			.fetchUserConnectionData()
			.then( userConnectionData => {
				dispatch( {
					type: USER_CONNECTION_DATA_FETCH_SUCCESS,
					userConnectionData: userConnectionData,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: USER_CONNECTION_DATA_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const disconnectSite = ( reloadAfter = false ) => {
	return dispatch => {
		dispatch( {
			type: DISCONNECT_SITE,
		} );
		dispatch(
			createNotice( 'is-info', __( 'Disconnecting Jetpack', 'jetpack' ), {
				id: 'disconnect-jetpack',
			} )
		);
		return restApi
			.disconnectSite()
			.then( disconnectingSite => {
				dispatch( {
					type: DISCONNECT_SITE_SUCCESS,
					disconnectingSite: disconnectingSite,
				} );
				dispatch( removeNotice( 'disconnect-jetpack' ) );
			} )
			.then( () => {
				dispatch( fetchConnectUrl() );

				if ( reloadAfter ) {
					window.location.reload();
				} else {
					dispatch( fetchSiteConnectionStatus() );
				}
			} )
			.catch( error => {
				dispatch( {
					type: DISCONNECT_SITE_FAIL,
					error: error,
				} );
				dispatch( removeNotice( 'disconnect-jetpack' ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: placeholder is an error message. */
							__( 'There was an error disconnecting Jetpack. Error: %s', 'jetpack' ),
							error
						),
						{ id: 'disconnect-jetpack' }
					)
				);
			} );
	};
};

export const unlinkUser = () => {
	return dispatch => {
		dispatch( {
			type: UNLINK_USER,
		} );
		dispatch(
			createNotice( 'is-info', __( 'Unlinking from WordPress.com', 'jetpack' ), {
				id: 'unlink-user',
			} )
		);
		return restApi
			.unlinkUser()
			.then( userUnlinked => {
				dispatch( {
					type: UNLINK_USER_SUCCESS,
					userUnlinked: userUnlinked,
				} );
				dispatch( fetchConnectUrl() );
				dispatch( removeNotice( 'unlink-user' ) );
				dispatch(
					createNotice( 'is-success', __( 'Unlinked from WordPress.com.', 'jetpack' ), {
						id: 'unlink-user',
						duration: 2000,
					} )
				);
			} )
			.catch( error => {
				dispatch( {
					type: UNLINK_USER_FAIL,
					error: error,
				} );
				dispatch( removeNotice( 'unlink-user' ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: placeholder is the error. */
							__( 'Error unlinking from WordPress.com. Error: %s', 'jetpack' ),
							error
						),
						{ id: 'unlink-user' }
					)
				);
			} );
	};
};

export const connectUser = ( featureLabel = null ) => {
	return dispatch => {
		dispatch( {
			type: CONNECT_USER,
			featureLabel,
		} );
	};
};

export const resetConnectUser = () => {
	return dispatch => {
		dispatch( {
			type: RESET_CONNECT_USER,
		} );
	};
};

export const reconnectSite = () => {
	const { restoreConnection } = useRestoreConnection();

	return dispatch => {
		dispatch( {
			type: SITE_RECONNECT,
		} );
		dispatch(
			createNotice( 'is-info', __( 'Reconnecting Jetpack', 'jetpack' ), {
				id: 'reconnect-jetpack',
			} )
		);

		return restoreConnection( false )
			.then( connectionStatusData => {
				const status = connectionStatusData.status;
				const authorizeUrl = connectionStatusData.authorizeUrl;
				// status: in_progress, aka user needs to re-connect their WP.com account.
				if ( 'in_progress' === status ) {
					dispatch( { type: UNLINK_USER_SUCCESS } );

					// Set connectUrl and initiate the connection flow.
					dispatch( {
						type: CONNECT_URL_FETCH_SUCCESS,
						connectUrl: authorizeUrl,
					} );
					dispatch( connectUser() );
				} else {
					window.location.reload();
				}
			} )
			.catch( error => {
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
			} );
	};
};

export const setHasSeenWCConnectionModal = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_CONNECTION_HAS_SEEN_WC_CONNECTION_MODAL,
		} );

		return restApi.setHasSeenWCConnectionModal();
	};
};
