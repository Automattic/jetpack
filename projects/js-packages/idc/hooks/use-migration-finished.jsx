import { useCallback, useState } from 'react';

/**
 * Custom hook to handle finishing migration action.
 *
 * @returns {{isFinishingMigration: boolean, finishMigrationCallback: ((function(): void)|*)}} Hook values.
 */
export default () => {
	const [ isFinishingMigration, setIsFinishingMigration ] = useState( false );

	/**
	 * Handle the "Got It" click after the migration has completed.
	 */
	const finishMigrationCallback = useCallback( () => {
		if ( ! isFinishingMigration ) {
			setIsFinishingMigration( true );
			window.location.reload();
		}
	}, [ isFinishingMigration, setIsFinishingMigration ] );

	return { isFinishingMigration, finishMigrationCallback };
};
