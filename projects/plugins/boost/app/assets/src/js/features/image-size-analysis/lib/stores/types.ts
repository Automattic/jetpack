import { z } from 'zod';

const zSummaryGroup = z.object( {
	issue_count: z.number(),
	scanned_pages: z.number(),
	total_pages: z.number(),
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

export type ISASummaryGroup = z.infer< typeof zSummaryGroup >;
export type ISASummary = z.infer< typeof zSummary >;

export type ISA_Group = z.infer< typeof zSummaryGroup >;
