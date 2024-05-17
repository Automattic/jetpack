import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const premiumFeaturesSchema = z.array( z.string() );

type PremiumFeatures = z.infer< typeof premiumFeaturesSchema >;

export const usePremiumFeatures = () => {
	const [ { data: premiumFeatures } ] = useDataSync(
		'jetpack_boost_ds',
		'premium_features',
		premiumFeaturesSchema
	);

	return premiumFeatures as PremiumFeatures;
};
