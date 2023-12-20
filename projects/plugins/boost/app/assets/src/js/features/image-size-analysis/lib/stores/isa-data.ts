import { IsaGlobal } from './types';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
export function useIsaData( page = 1, group = 'all' ) {
	return useDataSync(
		'jetpack_boost_ds',
		'image_size_analysis',
		IsaGlobal,
		{
			query: {
				initialData: () => undefined,
				// This allows to keep previous data like "Latest report date"
				// until the new data is loaded.
				placeholderData: previousData => previousData,
			},
		},
		{
			page,
			group,
		}
	);
}
