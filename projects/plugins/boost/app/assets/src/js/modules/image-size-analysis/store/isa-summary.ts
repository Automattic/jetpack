import { derived } from 'svelte/store';
import { z } from 'zod';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { isaIgnoredImages, isaData } from './isa-data';

const zGroup = z.object( {
	issue_count: z.number(),
	scanned_pages: z.number(),
	total_pages: z.number(),
} );

const image_size_analysis_summary = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_summary',
	z
		.object( {
			status: z.string(),
			groups: z
				.object( {
					front_page: zGroup,
					page: zGroup.optional(),
					post: zGroup.optional(),
					other: zGroup.optional(),
				} )
				.optional(),
		} )
		// Data unavailable when the the flag is disabled.
		.optional()
);

export const isaSummary = image_size_analysis_summary.store;
export const isaGroups = derived( isaSummary, () => ( {
	front_page: { name: 'Front Page', progress: 10, issues: 0, done: false },
} ) );

export const imageDataGroupTabs = derived(
	[ isaGroups, isaIgnoredImages ],
	( [ $isaGroups, $isaIgnoredImages ] ) => {
		const all = {
			name: 'All',
			issues:
				Object.values( $isaGroups )
					.map( group => group.issues )
					.reduce( ( a, b ) => a + b, 0 ) - $isaIgnoredImages.length,
		};

		const groups = {
			all,
			...$isaGroups,
		};

		return groups;
	}
);

export const imageDataActiveGroup = derived(
	[ imageDataGroupTabs, isaData ],
	( [ $groups, $imageData ] ): z.infer< typeof zGroup > => {
		return $groups[ $imageData.query.group ];
	}
);

export type ISA_Group = z.infer< typeof zGroup >;
