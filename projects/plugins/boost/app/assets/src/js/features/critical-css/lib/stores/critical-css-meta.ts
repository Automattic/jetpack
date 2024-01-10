import { z } from 'zod';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';

const CriticalCssMetaSchema = z
	.object( {
		proxy_nonce: z.coerce.string().optional(),
	} )
	.catch( {} );

const client = jetpack_boost_ds.createAsyncStore( 'critical_css_meta', CriticalCssMetaSchema );
export const criticalCssMeta = client.store;
