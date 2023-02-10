import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorResponse, MigrationStatus } from '../migration/types';

/**
 * Get migration status
 *
 * @param {object} restApi - Configured restApi
 * @param {restApi.fetchMigrationStatus} restApi.fetchMigrationStatus - Fetch status method
 * @returns {MigrationStatus} - MigrationStatus object
 */
export function useMigrationstatus( restApi: {
	fetchMigrationStatus: () => Promise< MigrationStatus >;
} ): MigrationStatus {
	const FETCH_INTERVAL = 3000;
	const activeIntervalId = useRef();
	const [ migrationStatus, setMigrationStatus ] = useState( { status: 'inactive' } );

	const clearActiveInterval = () => {
		clearInterval( activeIntervalId.current );
	};

	const checkMigrationStatus = useCallback( () => {
		restApi
			.fetchMigrationStatus()
			.then( ( status: MigrationStatus ) => {
				setMigrationStatus( status );
			} )
			.catch( ( e: { response: ErrorResponse } ) => {
				switch ( e.response?.code ) {
					// Jetpack connection is not established
					// doesn't need to ping for status anymore
					case 'missing_token':
						clearActiveInterval();
				}
			} );
	}, [ restApi ] );

	useEffect( () => {
		activeIntervalId.current = setInterval( () => checkMigrationStatus(), FETCH_INTERVAL );

		return clearActiveInterval;
	}, [ checkMigrationStatus ] );

	return migrationStatus;
}
