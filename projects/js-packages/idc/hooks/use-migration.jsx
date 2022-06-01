import restApi from '@automattic/jetpack-api';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from 'react';
import { STORE_ID } from '../state/store';
import trackAndBumpMCStats from '../tools/tracking';

/**
 * Custom hook to handle the migration action.
 *
 * @param {Function} onMigrated - The callback to be called when migration has completed.
 * @returns {{isMigrating: boolean, migrateCallback: ((function(): void)|*)}} Hook values.
 */
export default onMigrated => {
	const [ isMigrating, setIsMigrating ] = useState( false );

	const isActionInProgress = useSelect( select => select( STORE_ID ).getIsActionInProgress(), [] );
	const { setIsActionInProgress, setErrorType, clearErrorType } = useDispatch( STORE_ID );

	/**
	 * Initiate the migration.
	 */
	const migrateCallback = useCallback( () => {
		if ( ! isActionInProgress ) {
			trackAndBumpMCStats( 'migrate' );

			setIsActionInProgress( true );
			setIsMigrating( true );
			clearErrorType();

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
					setErrorType( 'migrate' );

					throw error;
				} );
		}
	}, [
		setIsMigrating,
		onMigrated,
		isActionInProgress,
		setIsActionInProgress,
		setErrorType,
		clearErrorType,
	] );

	return {
		isMigrating,
		migrateCallback,
	};
};
