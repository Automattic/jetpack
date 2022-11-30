import apiFetch from '@wordpress/api-fetch';
import { sprintf, __ } from '@wordpress/i18n';
import camelize from 'camelize';

const SET_CREDENTIALS_STATE_IS_FETCHING = 'SET_CREDENTIALS_STATE_IS_FETCHING';
const SET_CREDENTIALS_STATE = 'SET_CREDENTIALS_STATE';
const SET_STATUS = 'SET_STATUS';
const START_SCAN_OPTIMISTICALLY = 'START_SCAN_OPTIMISTICALLY';
const SET_STATUS_IS_FETCHING = 'SET_STATUS_IS_FETCHING';
const SET_SCAN_IS_UNAVAILABLE = 'SET_SCAN_IS_UNAVAILABLE';
const SET_SCAN_IS_ENQUEUING = 'SET_SCAN_IS_ENQUEUING';
const SET_INSTALLED_PLUGINS = 'SET_INSTALLED_PLUGINS';
const SET_INSTALLED_THEMES = 'SET_INSTALLED_THEMES';
const SET_WP_VERSION = 'SET_WP_VERSION';
const SET_JETPACK_SCAN = 'SET_JETPACK_SCAN';
const SET_PRODUCT_DATA = 'SET_PRODUCT_DATA';
const SET_THREAT_IS_UPDATING = 'SET_THREAT_IS_UPDATING';
const SET_THREATS_ARE_FIXING = 'SET_THREATS_ARE_FIXING';
const SET_MODAL = 'SET_MODAL';
const SET_NOTICE = 'SET_NOTICE';
const CLEAR_NOTICE = 'CLEAR_NOTICE';
const SET_HAS_REQUIRED_PLAN = 'SET_HAS_REQUIRED_PLAN';

const SET_WAF_IS_SEEN = 'SET_WAF_IS_SEEN';
const SET_WAF_IS_ENABLED = 'SET_WAF_IS_ENABLED';
const SET_WAF_IS_UPDATING = 'SET_WAF_IS_UPDATING';
const SET_WAF_IS_LOADING = 'SET_WAF_IS_LOADING';
const SET_WAF_CONFIG = 'SET_WAF_CONFIG';

const setStatus = status => {
	return { type: SET_STATUS, status };
};

const startScanOptimistically = () => {
	return { type: START_SCAN_OPTIMISTICALLY };
};

const refreshPlan = () => ( { dispatch } ) => {
	apiFetch( {
		path: 'jetpack-protect/v1/check-plan',
		method: 'GET',
	} ).then( hasRequiredPlan => dispatch( setHasRequiredPlan( hasRequiredPlan ) ) );
};

/**
 * Fetch Status
 *
 * @param {boolean} hardRefresh - Clears the status cache before fetching, when enabled.
 * @returns {Promise} - Promise which resolves with the status request results.
 */
const fetchStatus = hardRefresh =>
	apiFetch( {
		path: `jetpack-protect/v1/status${ hardRefresh ? '?hard_refresh=true' : '' }`,
		method: 'GET',
	} );

/**
 * Side effect action which will fetch the status from the server
 *
 * @param {boolean} hardRefresh - Clears the status cache before fetching, when enabled.
 * @returns {Promise} - Promise which resolves when the status is refreshed from an API fetch.
 */
const refreshStatus = ( hardRefresh = false ) => async ( { dispatch } ) => {
	dispatch( setStatusIsFetching( true ) );
	return await new Promise( ( resolve, reject ) => {
		return fetchStatus( hardRefresh )
			.then( checkStatus )
			.then( status => {
				dispatch( setScanIsUnavailable( 'unavailable' === status.status ) );
				dispatch( setStatus( camelize( status ) ) );
				resolve( status );
			} )
			.catch( error => {
				reject( error );
			} )
			.finally( () => {
				dispatch( setStatusIsFetching( false ) );
			} );
	} );
};

/**
 * Check Status
 *
 * @param {object} currentStatus - The status.
 * @param {number} attempts - The amount of recursive attempts that have already been made.
 * @returns {Promise} - Promise which resolves with the status once it has been checked.
 */
const checkStatus = ( currentStatus, attempts = 0 ) => {
	return new Promise( ( resolve, reject ) => {
		if ( 'unavailable' === currentStatus.status && attempts < 3 ) {
			fetchStatus( true )
				.then( newStatus => {
					setTimeout( () => {
						checkStatus( newStatus, attempts + 1 )
							.then( result => resolve( result ) )
							.catch( error => reject( error ) );
					}, 5000 );
				} )
				.catch( reject );
		} else {
			resolve( currentStatus );
		}
	} );
};

/**
 * Side effect action which will fetch the credential status from the server
 *
 * @returns {Promise} - Promise which resolves when the status is refreshed from an API fetch.
 */
const checkCredentials = () => async ( { dispatch } ) => {
	return await new Promise( ( resolve, reject ) => {
		dispatch( setCredentialsIsFetching( true ) );
		return apiFetch( {
			path: 'jetpack-protect/v1/check-credentials',
			method: 'POST',
		} )
			.then( credentials => {
				dispatch( setCredentials( credentials ) );
				resolve( credentials );
			} )
			.catch( error => {
				reject( error );
			} )
			.finally( () => {
				dispatch( setCredentialsIsFetching( false ) );
			} );
	} );
};

const setCredentialsIsFetching = isFetching => {
	return { type: SET_CREDENTIALS_STATE_IS_FETCHING, isFetching };
};

const setCredentials = credentials => {
	return { type: SET_CREDENTIALS_STATE, credentials };
};

const setStatusIsFetching = status => {
	return { type: SET_STATUS_IS_FETCHING, status };
};

const setScanIsUnavailable = status => {
	return { type: SET_SCAN_IS_UNAVAILABLE, status };
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

const setThreatsAreFixing = threatIds => {
	return { type: SET_THREATS_ARE_FIXING, threatIds };
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

	dispatch( setThreatsAreFixing( threatIds ) );

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

			// throw an error if not all threats were fixed
			const fixedThreats = threatArray.filter( threat => threat.status === 'fixed' );
			if ( ! fixedThreats.length === threatIds.length ) {
				throw 'Not all threats could be fixed.';
			}
		} )
		.then( () => {
			// threats fixed - refresh the status
			dispatch( refreshStatus() );
			dispatch(
				setNotice( {
					type: 'success',
					message: sprintf(
						// translators: placeholder is the number amount of fixed threats.
						__( '%s threats were fixed successfully', 'jetpack-protect' ),
						threatIds.length
					),
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
		} )
		.finally( () => {
			dispatch( setThreatsAreFixing( [] ) );
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
				dispatch( startScanOptimistically() );
				setTimeout( () => dispatch( refreshStatus( true ) ), 5000 );
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

const clearNotice = () => {
	return { type: CLEAR_NOTICE };
};

const setHasRequiredPlan = hasRequiredPlan => {
	return { type: SET_HAS_REQUIRED_PLAN, hasRequiredPlan };
};

const setWafIsEnabled = isEnabled => {
	return { type: SET_WAF_IS_ENABLED, isEnabled };
};

const setWafIsSeen = isSeen => {
	return { type: SET_WAF_IS_SEEN, isSeen };
};

const setWafIsUpdating = isUpdating => {
	return { type: SET_WAF_IS_UPDATING, isUpdating };
};

const setWafIsLoading = isLoading => {
	return { type: SET_WAF_IS_LOADING, isLoading };
};

const setWafConfig = config => {
	return { type: SET_WAF_CONFIG, config };
};

const actions = {
	checkCredentials,
	setCredentials,
	setCredentialsIsFetching,
	setStatus,
	startScanOptimistically,
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
	clearNotice,
	fixThreats,
	scan,
	setThreatsAreFixing,
	refreshPlan,
	setHasRequiredPlan,
	setScanIsUnavailable,
	setWafIsEnabled,
	setWafIsSeen,
	setWafIsUpdating,
	setWafIsLoading,
	setWafConfig,
};

export {
	SET_CREDENTIALS_STATE,
	SET_CREDENTIALS_STATE_IS_FETCHING,
	SET_STATUS,
	START_SCAN_OPTIMISTICALLY,
	SET_STATUS_IS_FETCHING,
	SET_SCAN_IS_UNAVAILABLE,
	SET_SCAN_IS_ENQUEUING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_JETPACK_SCAN,
	SET_PRODUCT_DATA,
	SET_THREAT_IS_UPDATING,
	SET_MODAL,
	SET_NOTICE,
	CLEAR_NOTICE,
	SET_THREATS_ARE_FIXING,
	SET_HAS_REQUIRED_PLAN,
	SET_WAF_IS_SEEN,
	SET_WAF_IS_ENABLED,
	SET_WAF_IS_UPDATING,
	SET_WAF_IS_LOADING,
	SET_WAF_CONFIG,
	actions as default,
};
