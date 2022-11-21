import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import camelize from 'camelize';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';

/**
 * Use Status Polling
 *
 * When the status is 'scheduled' or 'scanning', re-checks the status periodically until it isn't.
 */
const useStatusPolling = () => {
	const status = useSelect( select => select( STORE_ID ).getStatus() );
	const { setStatus, setStatusIsFetching, setScanIsUnavailable } = useDispatch( STORE_ID );

	useEffect( () => {
		let pollTimeout;
		const pollDuration = 10000;

		const statusIsInProgress = currentStatus =>
			[ 'scheduled', 'scanning' ].indexOf( currentStatus ) >= 0;

		const pollStatus = () => {
			return new Promise( ( resolve, reject ) => {
				apiFetch( {
					path: 'jetpack-protect/v1/status?hard_refresh=true',
					method: 'GET',
				} )
					.then( newStatus => {
						if ( newStatus?.error ) {
							throw newStatus?.errorMessage;
						}

						if ( statusIsInProgress( newStatus?.status ) ) {
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

		if ( ! statusIsInProgress( status?.status ) ) {
			return;
		}

		pollTimeout = setTimeout( () => {
			setStatusIsFetching( true );
			pollStatus()
				.then( newStatus => {
					setScanIsUnavailable( 'unavailable' === newStatus.status );
					setStatus( camelize( newStatus ) );
				} )
				.finally( () => {
					setStatusIsFetching( false );
				} );
		}, pollDuration );

		return () => clearTimeout( pollTimeout );
	}, [ status.status, setScanIsUnavailable, setStatus, setStatusIsFetching ] );
};

export default useStatusPolling;
