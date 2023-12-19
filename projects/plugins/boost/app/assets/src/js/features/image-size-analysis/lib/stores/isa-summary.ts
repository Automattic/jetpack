import { z } from 'zod';
import api from '$lib/api/api';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';
import { setPromiseInterval } from '$lib/utils/set-promise-interval';
import { type ISAGroupLabels } from '../isa-groups';

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

const zSummaryGroup = z.object( {
	issue_count: z.number(),
	scanned_pages: z.number(),
	total_pages: z.number(),
} );

export type ISASummaryGroup = z.infer< typeof zSummaryGroup >;

const zSummary = z
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

export type ISASummary = z.infer< typeof zSummary >;

const image_size_analysis_summary = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_summary',
	zSummary
);
// Prevent updates to image_size_analysis_summary from being pushed back to the server.
image_size_analysis_summary.setSyncAction( async ( _, value ) => value );

export const isaSummary = image_size_analysis_summary.store;

export function getSummaryProgress( summaryGroups: Record< string, ISASummaryGroup > ) {
	return Object.entries( summaryGroups ).map( ( [ group, data ] ) => {
		const progress = data.total_pages
			? Math.round( ( data.scanned_pages / data.total_pages ) * 100 )
			: 100;

		return {
			group: group as ISAGroupLabels,
			progress,
			done: progress === 100,
			has_issues: data.issue_count > 0,
			...data,
		};
	} );
}

/**
 * Function tracking the total number of issues.
 * @param summary
 */
export function getGroupedSummary( summary: ISASummary ): Record< string, ISA_Group > {
	const groups = Object.values( summary?.groups || {} );
	const totalIssueCount = groups.map( group => group.issue_count ).reduce( ( a, b ) => a + b, 0 );
	const page_count = groups.map( group => group.total_pages ).reduce( ( a, b ) => a + b, 0 );
	const scanned_pages = groups.map( group => group.scanned_pages ).reduce( ( a, b ) => a + b, 0 );

	const dataGroupTabs = {
		all: {
			issue_count: totalIssueCount,
			scanned_pages,
			total_pages: page_count,
		},
		...summary?.groups,
	};

	return dataGroupTabs;
}

export type ISA_Group = z.infer< typeof zSummaryGroup >;

/**
 * Request a new image size analysis.
 */
export async function requestImageAnalysis() {
	await api.post( '/image-size-analysis/start' );
	await image_size_analysis_summary.refresh();
}

/**
 * Ask for the image size analysis store to be populated.
 * Not automatically populated at load-time, as it is lazy. zzz.
 */
let initialized = false;
export function initializeIsaSummary() {
	if ( ! initialized ) {
		initialized = true;
		image_size_analysis_summary.refresh();
	}
}

/**
 * Automatically poll if the state is an active one.
 */
let clearPromiseInterval: ReturnType< typeof setPromiseInterval > | undefined;
isaSummary.subscribe( summary => {
	if ( ! summary ) {
		return;
	}

	const shouldPoll = [ 'new', 'queued' ].includes( summary.status );

	if ( shouldPoll && ! clearPromiseInterval ) {
		clearPromiseInterval = setPromiseInterval( async () => {
			await image_size_analysis_summary.refresh();
		}, 3000 );
	} else if ( ! shouldPoll && clearPromiseInterval ) {
		clearPromiseInterval();
		clearPromiseInterval = undefined;
	}
} );
