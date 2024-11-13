import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

/**
 * Hook to get the Cornerstone Pages.
 */
export function useCornerstonePages(): [
	string[],
	( newValue: string[], onSuccessCallback?: () => void ) => void,
] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'cornerstone_pages_list',
		z.array( z.string() )
	);

	function updatePages( newValue: string[], onSuccessCallback?: () => void ) {
		mutate( newValue, {
			onSuccess: onSuccessCallback,
		} );
	}

	return [ data || [], updatePages ];
}

const CornerstonePagesProperties = z.object( {
	max_pages: z.number(),
	max_pages_premium: z.number(),
	default_pages: z.array( z.string() ),
} );
type CornerstonePagesProperties = z.infer< typeof CornerstonePagesProperties >;

export function useCornerstonePagesProperties(): CornerstonePagesProperties | undefined {
	const [ { data } ] = useDataSync(
		'jetpack_boost_ds',
		'cornerstone_pages_properties',
		CornerstonePagesProperties
	);

	return data;
}
