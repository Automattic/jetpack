import { z } from 'zod';

/**
 *
 *
 * 	Zod Definitions
 *
 *
 */
const IsaCounts = z.object( {
	issue_count: z.number(),
	scanned_pages: z.number(),
	total_pages: z.number(),
} );

const Dimensions = z.object( {
	width: z.number(),
	height: z.number(),
} );

export const IsaImage = z.object( {
	id: z.string(),
	status: z.enum( [ 'active', 'ignored' ] ).default( 'active' ),
	type: z.enum( [ 'image_size', 'image_missing', 'bad_entry' ] ),
	thumbnail: z.string(),
	image: z.object( {
		url: z.string(),
		fixed: z.boolean(),
		dimensions: z.object( {
			file: Dimensions,
			expected: Dimensions,
			size_on_screen: Dimensions,
		} ),
		weight: z.object( {
			current: z.number(),
			potential: z.number(),
		} ),
	} ),
	page: z.object( {
		id: z.number(),
		url: z.string().url(),
		title: z.string(),
		edit_url: z.string().url().optional(),
	} ),
	device_type: z.enum( [ 'phone', 'desktop' ] ),
	instructions: z.string(),
} );

export const IsaGlobal = z
	.object( {
		query: z.object( {
			page: z.number(),
			group: z.string(),
			search: z.string(),
		} ),
		data: z.object( {
			last_updated: z.number(),
			total_pages: z.number(),
			images: z.array( IsaImage ),
		} ),
	} )
	// Prevent fatal error when this module isn't available.
	.catch( {
		query: {
			page: 0,
			group: '',
			search: '',
		},
		data: {
			last_updated: 0,
			total_pages: 0,
			images: [],
		},
	} );

/**
 * Valid values for the status field.
 */
export enum ISAStatus {
	NotFound = 'not-found',
	New = 'new',
	Queued = 'queued',
	Completed = 'completed',
	Error = 'error',
	Stuck = 'error_stuck',
}

export const IsaReport = z.object( {
	status: z.nativeEnum( ISAStatus ).default( ISAStatus.NotFound ),
	report_id: z.number().optional(),
	groups: z.object( {
		core_front_page: IsaCounts,
		singular_page: IsaCounts.optional(),
		singular_post: IsaCounts.optional(),
		other: IsaCounts.optional(),
		fixed: IsaCounts.optional(),
	} ),
} );

/**
 *
 *
 * 	Type Inference
 *
 *
 */
export type IsaReport = z.infer< typeof IsaReport >;
export type IsaCounts = z.infer< typeof IsaCounts >;
export type IsaImage = z.infer< typeof IsaImage >;
export type IsaGlobal = z.infer< typeof IsaGlobal >;
export type IsaReportGroups = {
	[ K in keyof IsaReport[ 'groups' ] | 'all' ]?: IsaCounts;
};
