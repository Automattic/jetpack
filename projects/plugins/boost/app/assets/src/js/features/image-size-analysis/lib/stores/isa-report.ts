import api from '$lib/api/api';
import { jetpack_boost_ds } from '$lib/stores/data-sync-client';
import { setPromiseInterval } from '$lib/utils/set-promise-interval';
import { type isGroupLabels } from '../isa-groups';
import { IsaReport, IsaCounts } from './types';

const isaReportDS = jetpack_boost_ds.createAsyncStore( 'image_size_analysis_summary', IsaReport );
// Prevent updates to image_size_analysis_report from being pushed back to the server.
isaReportDS.setSyncAction( async ( _, value ) => value );

export const isaReport = isaReportDS.store;

export function getReportProgress( groups: Record< string, IsaCounts > ) {
	return Object.entries( groups ).map( ( [ group, data ] ) => {
		const progress = data.total_pages
			? Math.round( ( data.scanned_pages / data.total_pages ) * 100 )
			: 100;

		return {
			group: group as isGroupLabels,
			progress,
			done: progress === 100,
			has_issues: data.issue_count > 0,
			...data,
		};
	} );
}

/**
 * Function tracking the total number of issues.
 * @param report
 */
export function getGroupedReport( report: IsaReport ): Record< string, IsaCounts > {
	const groups = Object.values( report?.groups || {} );
	const totalIssueCount = groups.map( group => group.issue_count ).reduce( ( a, b ) => a + b, 0 );
	const page_count = groups.map( group => group.total_pages ).reduce( ( a, b ) => a + b, 0 );
	const scanned_pages = groups.map( group => group.scanned_pages ).reduce( ( a, b ) => a + b, 0 );

	const dataGroupTabs = {
		all: {
			issue_count: totalIssueCount,
			scanned_pages,
			total_pages: page_count,
		},
		...report?.groups,
	};

	return dataGroupTabs;
}

/**
 * Request a new image size analysis.
 */
export async function requestImageAnalysis() {
	await api.post( '/image-size-analysis/start' );
	await isaReportDS.refresh();
}

/**
 * Ask for the image size analysis store to be populated.
 * Not automatically populated at load-time, as it is lazy. zzz.
 */
let initialized = false;
export function initializeIsaReport() {
	if ( ! initialized ) {
		initialized = true;
		isaReportDS.refresh();
	}
}

/**
 * Automatically poll if the state is an active one.
 */
let clearPromiseInterval: ReturnType< typeof setPromiseInterval > | undefined;
isaReport.subscribe( report => {
	if ( ! report ) {
		return;
	}

	const shouldPoll = [ 'new', 'queued' ].includes( report.status );

	if ( shouldPoll && ! clearPromiseInterval ) {
		clearPromiseInterval = setPromiseInterval( async () => {
			await isaReportDS.refresh();
		}, 3000 );
	} else if ( ! shouldPoll && clearPromiseInterval ) {
		clearPromiseInterval();
		clearPromiseInterval = undefined;
	}
} );
