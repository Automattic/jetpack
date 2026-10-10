/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Report a refetch to the table only after its first render.
 *
 * DataViews treats a table that mounts loading as a first load and hides its rows, so cached rows that are already stale on mount would vanish until the refetch ends.
 *
 * @param isFetching - Whether the rows on screen are revalidating.
 * @return Whether to show the table's loading state for the refetch.
 */
export function useTableRevalidating( isFetching: boolean ): boolean {
	const [ hasMounted, setHasMounted ] = useState( false );

	useEffect( () => {
		setHasMounted( true );
	}, [] );

	return hasMounted && isFetching;
}
