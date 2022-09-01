import { z } from 'zod';
import { createAsyncFactory } from '@async-options/factory';

const Jetpack_Boost_Options = z.object( {
	rest_api: z.object( {
		value: z.string().url(),
		nonce: z.string(),
	} ),
} );

const async = createAsyncFactory( 'jetpack_boost', Jetpack_Boost_Options );

export const options = {};

export const API = async.api;
