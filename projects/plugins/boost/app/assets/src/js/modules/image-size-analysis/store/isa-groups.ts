import { derived } from 'svelte/store';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { isaData } from './isa-data';
import { isaIgnoredImages } from './isa-ignored-images';

const Group = z.object( {
	name: z.string(),
	progress: z.number(),
	issues: z.number(),
	done: z.boolean(),
} );

const image_size_analysis_groups = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_groups',
	z
		.object( {
			home: Group,
			pages: Group,
			posts: Group,
			other: Group,
			ignored: Group,
		} )
		// Data unavailable when the the flag is disabled.
		.optional()
);

export const imageDataGroupTabs = derived(
	[ image_size_analysis_groups.store, isaIgnoredImages ],
	( [ $groups, $ignored ] ) => {
		const groups = {
			...{
				all: {
					name: 'All',
					issues:
						Object.values( $groups )
							.map( group => group.issues )
							.reduce( ( a, b ) => a + b, 0 ) - $ignored.length,
				},
			},
			...$groups,
		};

		return groups;
	}
);

export const imageDataActiveGroup = derived(
	[ imageDataGroupTabs, isaData ],
	( [ $groups, $imageData ] ): z.infer< typeof Group > => {
		return $groups[ $imageData.query.group ];
	}
);

export type ISA_Group = z.infer< typeof Group >;
export const isaGroups = image_size_analysis_groups.store;
