import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const configSchema = z.object( {
	version: z.string(),
	pluginDirUrl: z.string().url(),
	assetPath: z.string(),
	canResizeImages: z.boolean(),
	site: z.object( {
		url: z.string().url(),
		domain: z.string(),
		online: z.boolean(),
		isAtomic: z.boolean(),
	} ),
	api: z.object( {
		namespace: z.string(),
		prefix: z.string(),
	} ),
	postTypes: z.record( z.string(), z.string() ),
} );

export type ConfigType = z.infer< typeof configSchema >;

export const useConfig = () => {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'config', configSchema );

	return data as z.infer< typeof configSchema >;
};
