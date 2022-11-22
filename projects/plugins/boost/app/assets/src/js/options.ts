import { createAsyncFactory } from '@async-options/factory';
import { z } from 'zod';

const Jetpack_Boost_Options = z.object( {
	rest_api: z.object( {
		value: z.string().url(),
		nonce: z.string(),
	} ),
} );

const async = createAsyncFactory( 'jetpack_boost', Jetpack_Boost_Options );

export const options = {};

export const API = async.api;
