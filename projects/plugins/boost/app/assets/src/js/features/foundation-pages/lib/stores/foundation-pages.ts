import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

/**
 * Hook to get the Foundation Pages.
 */
export function useFoundationPages(): [ string[], ( newValue: string[] ) => void ] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'foundation_pages',
		z.array( z.string() )
	);

	function updatePages( newValue: string[] ) {
		mutate( newValue );
	}

	return [ data || [], updatePages ];
}
