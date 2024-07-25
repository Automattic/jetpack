import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import camelize from 'camelize';
import { useEffect } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { STORE_ID } from '../../state/store';

/**
 * Use Status Polling
 *
 * When the status is 'scheduled' or 'scanning', re-checks the status periodically until it isn't.
 */
const useStatusPolling = () => {
	const { recordEvent } = useAnalyticsTracks();
	const status = useSelect( select => select( STORE_ID ).getStatus() );
	const { setStatus, setStatusProgress, setStatusIsFetching, setScanIsUnavailable } =
		useDispatch( STORE_ID );
	useEffect( () => {
		let pollTimeout;
		const pollDuration = 10000;

		const statusIsInProgress = currentStatus =>
			[ 'scheduled', 'scanning' ].indexOf( currentStatus ) >= 0;

		// if there has never been a scan, and the scan status is idle, then we must still be getting set up
		const scanIsInitializing = ( currentStatus, lastChecked ) =>
			! lastChecked && currentStatus === 'idle';

		const pollStatus = () => {
			return new Promise( ( resolve, reject ) => {
				apiFetch( {
					path: 'jetpack-protect/v1/status?hard_refresh=true',
					method: 'GET',
				} )
					.then( newStatus => {
						if ( newStatus?.error ) {
							throw newStatus?.error_message;
						}

						if (
							statusIsInProgress( newStatus?.status ) ||
							scanIsInitializing( newStatus?.status, newStatus?.last_checked )
						) {
							setStatusProgress( newStatus?.current_progress );
							pollTimeout = setTimeout( () => {
								pollStatus()
									.then( result => resolve( result ) )
									.catch( error => reject( error ) );
							}, pollDuration );
							return;
						}

						resolve( newStatus );
					} )
					.catch( () => {
						// Keep trying when unable to fetch the status.
						setTimeout( () => {
							pollStatus()
								.then( result => resolve( result ) )
								.catch( error => reject( error ) );
						}, 5000 );
					} );
			} );
		};

		if (
			! statusIsInProgress( status?.status ) &&
			! scanIsInitializing( status?.status, status?.lastChecked )
		) {
			return;
		}

		pollTimeout = setTimeout( () => {
			setStatusIsFetching( true );
			pollStatus()
				.then( newStatus => {
					setScanIsUnavailable( 'unavailable' === newStatus.status );
					setStatus( camelize( newStatus ) );
					recordEvent( 'jetpack_protect_scan_completed', {
						scan_status: newStatus.status,
					} );
				} )
				.finally( () => {
					setStatusIsFetching( false );
				} );
		}, pollDuration );

		return () => clearTimeout( pollTimeout );
	}, [
		status?.status,
		status?.lastChecked,
		setScanIsUnavailable,
		setStatus,
		setStatusProgress,
		setStatusIsFetching,
		recordEvent,
	] );
};

export default useStatusPolling;
