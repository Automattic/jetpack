import { z } from 'zod';

export const SuperCacheInfo = z.object( {
	pluginActive: z.boolean(),
	cacheEnabled: z.boolean(),
	cachePageSecret: z.string().optional(),
} );

export type SuperCacheInfo = z.infer< typeof SuperCacheInfo >;
