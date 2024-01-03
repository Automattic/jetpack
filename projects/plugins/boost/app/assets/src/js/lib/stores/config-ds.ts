import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const configSchema = z.object( {
	plugin_dir_url: z.string().url(),
	pricing: z
		.object( {
			priceBefore: z.number(),
			priceAfter: z.number(),
			currencyCode: z.string(),
			isIntroductoryOffer: z.boolean(),
		} )
		.nullable(),
	site: z.object( {
		domain: z.string(),
		online: z.boolean(),
	} ),
	is_premium: z.boolean(),
	connection: z.object( {
		connected: z.boolean(),
		userConnected: z.boolean(),
		wpcomBlogId: z.number().nullable(),
	} ),
} );

export type ConfigType = z.infer< typeof configSchema >;

export const useConfig = () => {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'config', configSchema );

	return data as z.infer< typeof configSchema >;
};
