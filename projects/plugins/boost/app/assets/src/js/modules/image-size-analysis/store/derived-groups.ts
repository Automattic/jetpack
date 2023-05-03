import { derived } from 'svelte/store';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { imageData } from '../datasync-image-size-analysis';

const Group = z.object( {
	name: z.string(),
	progress: z.number(),
	issues: z.number(),
	done: z.boolean(),
} );

const image_size_analysis_groups = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_groups',
	z.object( {
		home: Group,
		pages: Group,
		posts: Group,
		other: Group,
	} )
);

export const imageDataGroupTabs = derived( image_size_analysis_groups.store, $groups => {
	const groups = {
		...{
			all: {
				name: 'All',
				issues: Object.values( $groups ).reduce( ( total, group ) => total + group.issues, 0 ),
			},
		},
		...$groups,
		...{
			ignored: {
				name: 'Ignored',
				issues: 0,
			},
		},
	};

	return groups;
} );

export const imageDataActiveGroup = derived(
	[ imageDataGroupTabs, imageData ],
	( [ $groups, $imageData ] ) => {
		return $groups[ $imageData.query.group ];
	}
);

export type ImageSizeAnalysisGroup = z.infer< typeof Group >;
export const imageDataGroups = image_size_analysis_groups.store;
