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

const zGroup = z.object( {
	issue_count: z.number(),
	scanned_pages: z.number(),
	total_pages: z.number(),
} );

const image_size_analysis_summary = jetpack_boost_ds.createAsyncStore(
	'image_size_analysis_summary',
	z
		.object( {
			status: z.nativeEnum( ISAStatus ).default( ISAStatus.NotFound ),
			report_id: z.number().optional(),
			groups: z
				.object( {
					core_front_page: zGroup,
					singular_page: zGroup.optional(),
					singular_post: zGroup.optional(),
					other: zGroup.optional(),
				} )
				.nullable()
				.optional(),
		} )
		// Default data if deactivated or not loaded yet.
		.nullable()
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

/**
 * Derived store tracking the total number of issues.
 */
export const totalIssueCount = derived( isaSummary, $isaSummary => {
	return Object.values( $isaSummary?.groups || {} )
		.map( group => group.issue_count )
		.reduce( ( a, b ) => a + b, 0 );
} );

/**
 * Derived store tracking the number of scanned pages.
 */
export const scannedPagesCount = derived( isaSummary, $isaSummary => {
	return Object.values( $isaSummary?.groups || {} )
		.map( group => group.scanned_pages )
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
	( [ $groups, $imageData ] ): z.infer< typeof zGroup > => {
		return $groups[ $imageData.query.group ];
	}
);

export type ISA_Group = z.infer< typeof zGroup >;

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
