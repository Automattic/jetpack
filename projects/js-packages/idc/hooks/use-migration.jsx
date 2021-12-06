/**
 * External dependencies
 */
import { useCallback, useState } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import trackAndBumpMCStats from '../tools/tracking';
import { STORE_ID } from '../state/store';

/**
 * Custom hook to handle the migration action.
 *
 * @param {Function} onMigrated - The callback to be called when migration has completed.
 * @returns {{isMigrating: boolean, migrateCallback: ((function(): void)|*)}} Hook values.
 */
export default onMigrated => {
	const [ isMigrating, setIsMigrating ] = useState( false );

	const isActionInProgress = useSelect( select => select( STORE_ID ).getIsActionInProgress(), [] );
	const { setIsActionInProgress } = useDispatch( STORE_ID );

	/**
	 * Initiate the migration.
	 */
	const migrateCallback = useCallback( () => {
		if ( ! isActionInProgress ) {
			trackAndBumpMCStats( 'migrate' );

			setIsActionInProgress( true );
			setIsMigrating( true );

			restApi
				.migrateIDC()
				.then( () => {
					setIsMigrating( false );

					if ( onMigrated && {}.toString.call( onMigrated ) === '[object Function]' ) {
						onMigrated();
					}
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsMigrating( false );
					throw error;
				} );
		}
	}, [ setIsMigrating, onMigrated, isActionInProgress, setIsActionInProgress ] );

	return {
		isMigrating,
		migrateCallback,
	};
};
