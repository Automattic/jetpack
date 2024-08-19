import { __ } from '@wordpress/i18n';
import { SCAN_IN_PROGRESS_STATUSES, SCAN_STATUS_OPTIMISTICALLY_SCANNING } from '../constants';

/**
 * Scan in progress selector.
 *
 * @param {object} state - The current state.
 * @returns {boolean} Whether a scan is in progress.
 */
const scanInProgress = state => {
	const { status, lastChecked, error } = selectors.getStatus( state );
	const unavailable = selectors.getScanIsUnavailable( state );

	// When "optimistically" scanning, ignore any other status or error.
	if ( SCAN_STATUS_OPTIMISTICALLY_SCANNING === status ) {
		return true;
	}

	// If the scan is unavailable, scanning is not in progress.
	if ( unavailable ) {
		return false;
	}

	// If the status is one of the scanning statuses, we are scanning.
	if ( SCAN_IN_PROGRESS_STATUSES.includes( status ) ) {
		return true;
	}

	// If we have no record of a previous scan, we must be queueing up the initial scan.
	if ( ! lastChecked && ! error ) {
		return true;
	}

	return false;
};

/**
 * Scan error selector.
 *
 * @param {object} state - The current state.
 *
 * @typedef {object} ScanError
 * @property {string} code    - The code identifying the type of error.
 * @property {string} message - A message describing the error.
 *
 * @returns {ScanError|null} The error object or null.
 */
const scanError = state => {
	const { status, error, errorCode, errorMessage } = selectors.getStatus( state );
	const unavailable = selectors.getScanIsUnavailable( state );
	const isFetching = selectors.getStatusIsFetching( state );

	// If the scan results include an error, return it.
	if ( error ) {
		return { code: errorCode, message: errorMessage };
	}

	// If the scan is unavailable, return an error.
	if ( unavailable ) {
		return {
			code: 'scan_unavailable',
			message: __( 'We are having problems scanning your site.', 'jetpack-protect' ),
		};
	}

	// If there is no status and we are not requesting it, return an error.
	if ( ! status && ! isFetching ) {
		return {
			code: 'scan_unavailable',
			message: __( 'We are having problems scanning your site.', 'jetpack-protect' ),
		};
	}

	return null;
};

const selectors = {
	getCredentials: state => state.credentials || null,
	getCredentialsIsFetching: state => state.credentialsIsFetching || false,
	getInstalledPlugins: state => state.installedPlugins || {},
	getInstalledThemes: state => state.installedThemes || {},
	getScanHistory: state => state.scanHistory || {},
	getStatus: state => state.status || {},
	getStatusIsFetching: state => state.statusIsFetching || false,
	getScanIsUnavailable: state => state.scanIsUnavailable || false,
	getScanIsEnqueuing: state => state.scanIsEnqueuing || false,
	scanInProgress,
	scanError,
	getWpVersion: state => state.wpVersion || '',
	getJetpackScan: state => state.jetpackScan || {},
	getThreatsUpdating: state => state.threatsUpdating || {},
	getModalType: state => state.modal?.type || null,
	getModalProps: state => state.modal?.props || {},
	getNotice: state => state.notice || null,
	getThreatsAreFixing: state => state.threatsAreFixing || [],
	hasRequiredPlan: state => state.hasRequiredPlan || false,
	getOnboardingProgress: state => state.onboardingProgress || null,
	getWaf: state => state.waf,
};

export default selectors;
