import { z } from 'zod';
import { type ISA } from './isa-data';
import api from '$lib/api/api';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';
import { setPromiseInterval } from '$lib/utils/set-promise-interval';

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
			group,
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
export function getTotalIssueCount( summary: ISASummary ) {
	return Object.values( summary?.groups || {} )
		.map( group => group.issue_count )
		.reduce( ( a, b ) => a + b, 0 );
}

/**
 * Function tracking the number of total pages being scanned.
 * @param summary
 */
export function getTotalPagesCount( summary: ISASummary ) {
	return Object.values( summary?.groups || {} )
		.map( group => group.total_pages )
		.reduce( ( a, b ) => a + b, 0 );
}

/**
 * Function which describes tabs to display in the UI.
 * @param summary
 * @param totalIssueCount
 */
export function imageDataGroupTabs( summary: ISASummary ): Record< string, ISASummaryGroup > {
	return {
		all: {
			total_pages: getTotalPagesCount( summary ),
			scanned_pages: getTotalPagesCount( summary ),
			issue_count: getTotalIssueCount( summary )
		},
		...summary?.groups,
	};
}

/**
 * Function which describes the currently active tab.
 * @param summary
 * @param data
 */
export function imageDataActiveGroup( summary: ISASummary, data: ISA ) {
	// Get the tabs from the imageDataGroupTabs function
	const tabs = imageDataGroupTabs( summary );
	const group = data.query.group;
	if( group in tabs ) {
		return tabs[group] as ISASummaryGroup;
	}
	return tabs.all;
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
