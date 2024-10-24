import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

/**
 * Hook to get the Foundation Pages.
 */
export function useFoundationPages(): [
	string[],
	( newValue: string[], onSuccessCallback?: () => void ) => void,
] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'foundation_pages_list',
		z.array( z.string() )
	);

	function updatePages( newValue: string[], onSuccessCallback?: () => void ) {
		mutate( newValue, {
			onSuccess: onSuccessCallback,
		} );
	}

	return [ data || [], updatePages ];
}

const FoundationPagesProperties = z.object( {
	max_pages: z.number(),
	blog_url: z.string().nullable(),
} );
type FoundationPagesProperties = z.infer< typeof FoundationPagesProperties >;

export function useFoundationPagesProperties(): FoundationPagesProperties | undefined {
	const [ { data } ] = useDataSync(
		'jetpack_boost_ds',
		'foundation_pages_properties',
		FoundationPagesProperties
	);

	return data;
}
