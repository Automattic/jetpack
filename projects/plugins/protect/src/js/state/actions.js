import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';

const SET_CREDENTIAL_STATE_IS_FETCHING = 'SET_CREDENTIAL_STATE_IS_FETCHING';
const SET_CREDENTIAL_STATE = 'SET_CREDENTIAL_STATE';
const SET_STATUS = 'SET_STATUS';
const SET_STATUS_IS_FETCHING = 'SET_STATUS_IS_FETCHING';
const SET_SCAN_IS_ENQUEUING = 'SET_SCAN_IS_ENQUEUING';
const SET_INSTALLED_PLUGINS = 'SET_INSTALLED_PLUGINS';
const SET_INSTALLED_THEMES = 'SET_INSTALLED_THEMES';
const SET_WP_VERSION = 'SET_WP_VERSION';
const SET_JETPACK_SCAN = 'SET_JETPACK_SCAN';
const SET_PRODUCT_DATA = 'SET_PRODUCT_DATA';
const SET_THREAT_IS_UPDATING = 'SET_THREAT_IS_UPDATING';
const SET_MODAL = 'SET_MODAL';
const SET_NOTICE = 'SET_NOTICE';

const setStatus = status => {
	return { type: SET_STATUS, status };
};

/**
 * Side effect action which will fetch the status from the server
 *
 * @returns {Promise} - Promise which resolves when the status is refreshed from an API fetch.
 */
const refreshStatus = () => async ( { dispatch } ) => {
	dispatch( setStatusIsFetching( true ) );
	return await new Promise( ( resolve, reject ) => {
		return apiFetch( {
			path: 'jetpack-protect/v1/status',
			method: 'GET',
		} )
			.then( status => {
				dispatch( setStatus( camelize( status ) ) );
				dispatch( setStatusIsFetching( false ) );
				resolve( status );
			} )
			.catch( error => {
				reject( error );
			} );
	} );
};

/**
 * Side effect action which will fetch the credential status from the server
 *
 * @returns {Promise} - Promise which resolves when the status is refreshed from an API fetch.
 */
const checkCredentialsState = () => async ( { dispatch } ) => {
	return await new Promise( ( resolve, reject ) => {
		dispatch( setCredentialStateIsFetching( true ) );
		return apiFetch( {
			path: 'jetpack-protect/v1/check-credentials',
			method: 'POST',
		} )
			.then( state => {
				dispatch( setCredentialState( state ) );
				resolve( state );
			} )
			.catch( error => {
				reject( error );
			} )
			.finally( () => {
				dispatch( setCredentialStateIsFetching( false ) );
			} );
	} );
};

const setCredentialStateIsFetching = isFetching => {
	return { type: SET_CREDENTIAL_STATE_IS_FETCHING, isFetching };
};

const setCredentialState = credentialState => {
	return { type: SET_CREDENTIAL_STATE, credentialState };
};

const setStatusIsFetching = status => {
	return { type: SET_STATUS_IS_FETCHING, status };
};

const setScanIsEnqueuing = isEnqueuing => {
	return { type: SET_SCAN_IS_ENQUEUING, isEnqueuing };
};

const setInstalledPlugins = plugins => {
	return { type: SET_INSTALLED_PLUGINS, plugins };
};

const setInstalledThemes = themes => {
	return { type: SET_INSTALLED_THEMES, themes };
};

const setwpVersion = version => {
	return { type: SET_WP_VERSION, version };
};

const setJetpackScan = scan => {
	return { type: SET_JETPACK_SCAN, scan };
};

const setProductData = productData => {
	return { type: SET_PRODUCT_DATA, productData };
};

const setThreatIsUpdating = ( threatId, isUpdating ) => {
	return { type: SET_THREAT_IS_UPDATING, payload: { threatId, isUpdating } };
};

const ignoreThreat = ( threatId, callback = () => {} ) => async ( { dispatch } ) => {
	dispatch( setThreatIsUpdating( threatId, true ) );
	return await new Promise( () => {
		return apiFetch( {
			path: `jetpack-protect/v1/ignore-threat?threat_id=${ threatId }`,
			method: 'POST',
		} )
			.then( () => {
				return dispatch( refreshStatus() );
			} )
			.then( () => {
				return dispatch(
					setNotice( { type: 'success', message: __( 'Threat ignored', 'jetpack-protect' ) } )
				);
			} )
			.catch( () => {
				return dispatch(
					setNotice( {
						type: 'error',
						message: __( 'An error ocurred ignoring the threat.', 'jetpack-protect' ),
					} )
				);
			} )
			.finally( () => {
				dispatch( setThreatIsUpdating( threatId, false ) );
				callback();
			} );
	} );
};

const getFixThreatsStatus = threatIds => async ( { dispatch } ) => {
	const path = threatIds.reduce( ( carryPath, threatId ) => {
		return `${ carryPath }threat_ids[]=${ threatId }&`;
	}, 'jetpack-protect/v1/fix-threats-status?' );

	return await apiFetch( {
		path,
		method: 'GET',
	} )
		.then( async response => {
			const threatArray = Object.values( response.threats );
			const inProgressThreats = threatArray.filter( threat => 'in_progress' === threat.status );

			if ( inProgressThreats.length > 0 ) {
				// fix still in progress - try again in another second
				return await new Promise( () => {
					setTimeout( () => {
						dispatch( getFixThreatsStatus( threatIds ) );
					}, 1000 );
				} );
			}
		} )
		.then( () => {
			// threats fixed - refresh the status
			dispatch( refreshStatus() );
			dispatch(
				setNotice( {
					type: 'success',
					// to do: include amount of fixed threats
					message: __( 'Threats were fixed successfully', 'jetpack-protect' ),
				} )
			);
		} )
		.catch( () => {
			dispatch(
				setNotice( {
					type: 'error',
					message: __(
						'Not all threats could be fixed. Please contact our support.',
						'jetpack-protect'
					),
				} )
			);
		} );
};

const fixThreats = ( threatIds, callback = () => {} ) => async ( { dispatch } ) => {
	threatIds.forEach( threatId => {
		dispatch( setThreatIsUpdating( threatId, true ) );
	} );
	return await new Promise( () => {
		return apiFetch( {
			path: `jetpack-protect/v1/fix-threats?threat_ids=${ threatIds }`,
			method: 'POST',
			data: { threatIds },
		} )
			.then( () => {
				return dispatch(
					setNotice( {
						type: 'success',
						message: __(
							"We're hard at work fixing this threat in the background. Please check back shortly.",
							'jetpack-protect'
						),
					} )
				);
			} )
			.then( () => {
				// wait one second, then start checking if the threats have been fixed
				setTimeout( () => dispatch( getFixThreatsStatus( threatIds ) ), 1000 );
			} )
			.catch( () => {
				return dispatch(
					setNotice( {
						type: 'error',
						message: __( 'Error fixing threats. Please contact support.', 'jetpack-protect' ),
					} )
				);
			} )
			.finally( () => {
				threatIds.forEach( threatId => {
					dispatch( setThreatIsUpdating( threatId, false ) );
				} );
				callback();
			} );
	} );
};

const scan = ( callback = () => {} ) => async ( { dispatch } ) => {
	dispatch( setScanIsEnqueuing( true ) );
	return await new Promise( () => {
		return apiFetch( {
			path: `jetpack-protect/v1/scan`,
			method: 'POST',
		} )
			.then( () => {
				return dispatch(
					setNotice( {
						type: 'success',
						message: __( 'Scan was enqueued successfully', 'jetpack-protect' ),
					} )
				);
			} )
			.then( () => {
				return dispatch( refreshStatus() );
			} )
			.catch( () => {
				return dispatch(
					setNotice( {
						type: 'error',
						message: __( 'An error ocurred enqueuing the scan', 'jetpack-protect' ),
					} )
				);
			} )
			.finally( () => {
				dispatch( setScanIsEnqueuing( false ) );
				callback();
			} );
	} );
};

/**
 * Set Modal
 *
 * @param {object}      modal       - The modal payload to set in state.
 * @param {null|string} modal.type  - The modal slug, or null to display no modal.
 * @param {object}      modal.props - The props to pass to the modal component.
 * @returns {object} The modal action object.
 */
const setModal = modal => {
	return { type: SET_MODAL, payload: modal };
};

const setNotice = notice => {
	return { type: SET_NOTICE, payload: notice };
};

const actions = {
	checkCredentialsState,
	setCredentialState,
	setCredentialStateIsFetching,
	setStatus,
	refreshStatus,
	setStatusIsFetching,
	setScanIsEnqueuing,
	setInstalledPlugins,
	setInstalledThemes,
	setwpVersion,
	setJetpackScan,
	setProductData,
	ignoreThreat,
	setModal,
	setNotice,
	fixThreats,
	scan,
};

export {
	SET_CREDENTIAL_STATE,
	SET_CREDENTIAL_STATE_IS_FETCHING,
	SET_STATUS,
	SET_STATUS_IS_FETCHING,
	SET_SCAN_IS_ENQUEUING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_JETPACK_SCAN,
	SET_THREAT_IS_UPDATING,
	SET_MODAL,
	SET_NOTICE,
	actions as default,
};
