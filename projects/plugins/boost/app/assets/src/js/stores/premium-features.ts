import { z } from 'zod';
import { jetpack_boost_ds } from './data-sync-client';

export const premiumFeaturesClient = jetpack_boost_ds.createAsyncStore(
	'premium_features',
	z.array( z.string() )
);
export const premiumFeatures = premiumFeaturesClient.store;
