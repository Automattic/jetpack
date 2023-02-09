import { useState, useEffect, useCallback } from 'react';
import { MigrationStatus } from '../migration/types';

/**
 * Get migration status
 *
 * @param {object} restApi - Configured restApi
 * @returns {MigrationStatus} - MigrationStatus object
 */
export function useMigrationstatus( restApi ): MigrationStatus {
	const FETCH_INTERVAL = 3000;
	const [ migrationStatus, setMigrationStatus ] = useState( { status: 'inactive' } );

	const checkMigrationStatus = useCallback( () => {
		restApi.fetchMigrationStatus().then( ( status: MigrationStatus ) => {
			setMigrationStatus( status );
		} );
	}, [ restApi ] );

	useEffect( () => {
		const interval = setInterval( checkMigrationStatus, FETCH_INTERVAL );

		return () => {
			clearInterval( interval );
		};
	}, [ checkMigrationStatus ] );

	return migrationStatus;
}
