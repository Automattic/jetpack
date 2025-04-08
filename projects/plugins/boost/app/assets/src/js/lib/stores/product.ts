import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const ProductSchema = z
	.object( {
		tiers: z.array( z.string() ),
		features_by_tier: z.array(
			z.object( {
				name: z.string(),
				info: z.object( {
					title: z.string().optional(),
					content: z.string(),
				} ),
				tiers: z.object( {
					free: z.object( {
						included: z.boolean(),
						description: z.string().optional(),
						info: z
							.object( {
								title: z.string().optional(),
								content: z.string(),
								class: z.string().optional(),
							} )
							.optional(),
					} ),
					upgraded: z.object( {
						included: z.boolean(),
						description: z.string().optional(),
						info: z
							.object( {
								title: z.string().optional(),
								content: z.string(),
								class: z.string().optional(),
							} )
							.optional(),
					} ),
				} ),
			} )
		),
	} )
	.nullable();

export type ProductSchema = z.infer< typeof ProductSchema >;

export const useProduct = () => {
	const [ { data } ] = useDataSync( 'jetpack_boost_ds', 'product', ProductSchema );

	return data;
};
