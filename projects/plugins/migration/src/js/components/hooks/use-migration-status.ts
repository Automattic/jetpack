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
	const [ migrationStatus, setMigrationStatus ] = useState();

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
				if ( ! e.response?.code ) {
					return;
				}
				switch ( e.response?.code ) {
					case 'missing_token':
					case 'unavailable_site_id':
						setMigrationStatus( { status: 'inactive' } );
						break;

					default:
						setMigrationStatus( {
							status: 'error',
							errorCode: e.response?.code,
							message: e.response?.message,
						} );
						break;
				}
			} );
	}, [ restApi ] );

	useEffect( () => {
		checkMigrationStatus();
		activeIntervalId.current = setInterval( () => checkMigrationStatus(), FETCH_INTERVAL );

		return clearActiveInterval;
	}, [ checkMigrationStatus ] );

	return migrationStatus;
}
