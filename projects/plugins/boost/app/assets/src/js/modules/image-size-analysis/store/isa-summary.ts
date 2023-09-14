import { derived } from 'svelte/store';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import api from '../../../api/api';
import { jetpack_boost_ds } from '../../../stores/data-sync-client';
import { setPromiseInterval } from '../../../utils/set-promise-interval';
import { isaData } from './isa-data';

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
export const isaGroups = derived( isaSummary, () => ( {
	core_front_page: { name: 'Front Page', progress: 10, issues: 0, done: false },
} ) );

export const isaGroupLabels = {
	all: __( 'All', 'jetpack-boost' ),
	core_front_page: __( 'Homepage', 'jetpack-boost' ),
	singular_page: __( 'Pages', 'jetpack-boost' ),
	singular_post: __( 'Posts', 'jetpack-boost' ),
	other: __( 'Other', 'jetpack-boost' ),
};

export function isaGroupLabel( group: keyof typeof isaGroupLabels | string ) {
	if ( ! isaGroupLabels[ group ] ) {
		return group;
	}
	return isaGroupLabels[ group ];
}

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
 * Derived store tracking the total number of issues.
 */
export const totalIssueCount = derived( isaSummary, $isaSummary => {
	return Object.values( $isaSummary?.groups || {} )
		.map( group => group.issue_count )
		.reduce( ( a, b ) => a + b, 0 );
} );

/**
 * Derived store tracking the number of total pages being scanned.
 */
export const totalPagesCount = derived( isaSummary, $isaSummary => {
	return Object.values( $isaSummary?.groups || {} )
		.map( group => group.total_pages )
		.reduce( ( a, b ) => a + b, 0 );
} );

/**
 * Derived store which describes tabs to display in the UI.
 */
export const imageDataGroupTabs = derived(
	[ isaSummary, totalIssueCount ],
	( [ $isaSummary, $totalIssueCount ] ) => ( {
		all: { issue_count: $totalIssueCount },
		...$isaSummary?.groups,
	} )
);

/**
 * Derived store which describes the currently active tab.
 */
export const imageDataActiveGroup = derived(
	[ imageDataGroupTabs, isaData ],
	( [ $groups, $imageData ] ): z.infer< typeof zSummaryGroup > => {
		return $groups[ $imageData.query.group ];
	}
);

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
