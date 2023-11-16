import { z } from 'zod';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';

const CriticalCssMetaSchema = z
	.object( {
		callback_passthrough: z.record( z.unknown() ).optional(),
		proxy_nonce: z.coerce.string().optional(),
		viewports: z
			.array(
				z.object( {
					type: z.coerce.string(),
					width: z.coerce.number(),
					height: z.coerce.number(),
				} )
			)
			.optional(),
	} )
	.catch( {
		callback_passthrough: {},
		viewports: [],
	} );

const client = jetpack_boost_ds.createAsyncStore( 'critical_css_meta', CriticalCssMetaSchema );
export const criticalCssMeta = client.store;
