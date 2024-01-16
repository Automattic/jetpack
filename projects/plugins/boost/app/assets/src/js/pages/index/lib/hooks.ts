import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const usePremiumFeatures = () => {
	const [ { data: premiumFeatures } ] = useDataSync(
		'jetpack_boost_ds',
		'premium_features',
		z.array( z.string() )
	);

	return premiumFeatures;
};
