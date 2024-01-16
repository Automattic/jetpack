import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const configSchema = z.object( {
	version: z.string(),
	plugin_dir_url: z.string().url(),
	site: z.object( {
		url: z.string().url(),
		domain: z.string(),
		online: z.boolean(),
		isAtomic: z.boolean(),
		postTypes: z.record( z.string(), z.string() ),
		canResizeImages: z.boolean(),
		assetPath: z.string(),
	} ),
	api: z.object( {
		namespace: z.string(),
		prefix: z.string(),
	} ),
} );

export type ConfigType = z.infer< typeof configSchema >;

export const useConfig = () => {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'config', configSchema );

	return data as z.infer< typeof configSchema >;
};
