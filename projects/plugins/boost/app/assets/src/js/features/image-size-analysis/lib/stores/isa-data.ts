import { IsaGlobal } from './types';
import { DataSync, useDataSync } from '@automattic/jetpack-react-data-sync-client';

export function useIsaData( page = 1, group = 'all' ) {
	const namespace = 'jetpack_boost_ds';
	const key = 'image_size_analysis';
	const datasync = new DataSync( namespace, key, IsaGlobal );
	const params = { page, group };
	return useDataSync(
		namespace,
		key,
		IsaGlobal,
		{
			query: {
				initialData: () => undefined,
				// This allows to keep previous data like "Latest report date"
				// until the new data is loaded.
				placeholderData: previousData => previousData,
				queryFn: async () => datasync.ACTION( 'paginate', params, IsaGlobal ),
			},
		},
		params
	);
}
