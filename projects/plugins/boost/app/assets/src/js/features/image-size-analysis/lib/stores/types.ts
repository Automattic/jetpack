import { z } from 'zod';

/**
 *
 *
 * 	Zod Definitions
 *
 *
 */
const zSummaryGroup = z.object( {
	issue_count: z.number(),
	scanned_pages: z.number(),
	total_pages: z.number(),
} );

const Dimensions = z.object( {
	width: z.number(),
	height: z.number(),
} );

export const ImageData = z.object( {
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

export const ImageSizeAnalysis = z
	.object( {
		query: z.object( {
			page: z.number(),
			group: z.string(),
			search: z.string(),
		} ),
		data: z.object( {
			last_updated: z.number(),
			total_pages: z.number(),
			images: z.array( ImageData ),
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

export const zSummary = z
	.object( {
		status: z.nativeEnum( ISAStatus ).default( ISAStatus.NotFound ),
		report_id: z.number().optional(),
		groups: z
			.object( {
				core_front_page: zSummaryGroup,
				singular_page: zSummaryGroup.optional(),
				singular_post: zSummaryGroup.optional(),
				other: zSummaryGroup.optional(),
				fixed: zSummaryGroup.optional(),
			} )
			.nullable()
			.optional(),
	} )
	// Default data if deactivated or not loaded yet.
	.nullable();

/**
 *
 *
 * 	Type Inference
 *
 *
 */
export type ISA_Data = z.infer< typeof ImageData >;
export type ISASummaryGroup = z.infer< typeof zSummaryGroup >;
export type ISASummary = z.infer< typeof zSummary >;
export type ISA_Group = z.infer< typeof zSummaryGroup >;
export type ImageDataType = z.infer< typeof ImageData >;
export type ISA = z.infer< typeof ImageSizeAnalysis >;
