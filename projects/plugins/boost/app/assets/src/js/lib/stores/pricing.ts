import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const PricingSchema = z
	.object( {
		priceBefore: z.number(),
		priceAfter: z.number(),
		currencyCode: z.string(),
		isIntroductoryOffer: z.boolean(),
	} )
	.nullable();

export type PricingSchema = z.infer< typeof PricingSchema >;

export const usePricing = () => {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'pricing', PricingSchema );

	return data;
};
