import { useState } from 'react';
import { API, SCAN_STATE_SCANNING, usePolling, type ScanState, type SiteScan } from '..';
import { type ApiError } from '../lib/api';

type UseScanReturn = {
	/** Data returned from the Scan API. */
	data: SiteScan | undefined;
	/** The error data returned from the Scan API. */
	error: unknown;
	/** Fetch data from the Scan API. */
	fetch: () => void;
	/** Fetch data from the Scan API until a complete scan result is available. */
	poll: () => void;
	/** Whether the fetch or poll is currently in progress. */
	loading: boolean;
};

/**
 * Scan Hook
 *
 * React hook for interacting with the Jetpack Scan API.
 *
 * @returns {UseScanReturn} - The hook return values.
 *
 * @todo Alternate authentication methods for public-api.
 */
const useScan = (): UseScanReturn => {
	const [ data, setData ] = useState< SiteScan | undefined >();
	const [ error, setError ] = useState< ApiError | undefined >();
	const [ loading, setLoading ] = useState< boolean >( false );

	/**
	 * Fetch the latest scan data from the Jetpack Scan API
	 * and update it in state.
	 *
	 * @returns {Promise<unknown>} - The response from the API.
	 */
	const fetch = async (): Promise< unknown > => {
		setLoading( true );

		try {
			/** @todo Validate response. */
			const response = await API.getScan();
			setData( response as SiteScan );
			return response;
		} catch ( apiError ) {
			setError( apiError as ApiError );
			return apiError;
		} finally {
			setLoading( false );
		}
	};

	/**
	 * Continue polling if the scan is still in progress.
	 *
	 * @param {unknown} response - The response from the Scan API.
	 *
	 * @returns {boolean} - Whether to continue polling.
	 */
	const handleCallbackResponse = ( response: unknown ): boolean => {
		if ( ! response ) {
			return false;
		}

		const { state } = response as { state: ScanState };

		return state === SCAN_STATE_SCANNING;
	};

	/**
	 * Stop polling when an error occurs, and set the error in state.
	 *
	 * @param {unknown} callbackError - The error from the Scan API.
	 *
	 * @returns {boolean} - Whether to continue polling.
	 */
	const handleCallbackError = callbackError => {
		setError( callbackError );
		return false;
	};

	const { start: poll, isPolling } = usePolling( {
		callback: fetch,
		handleCallbackResponse,
		handleCallbackError,
		interval: 5_000,
	} );

	return {
		data,
		error,
		fetch,
		poll,
		loading: loading || isPolling,
	};
};

export default useScan;
