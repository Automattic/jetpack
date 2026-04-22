/**
 * Top-level Activity Log admin page. Ported from Calypso's
 * `client/dashboard/sites/logs-activity/dataviews/index.tsx`. Scope
 * simplifications vs. the source are tracked in the Phase 3 PR: no date
 * range picker, no URL-persistent view state, no analytics, no tier
 * gating, no upsell callout.
 */
import { useQuery } from '@tanstack/react-query';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import fastDeepEqual from 'fast-deep-equal/es6';
import { useCallback, useMemo, useState } from 'react';
import { activityLogQuery, activityLogGroupCountsQuery } from '../../hooks/use-activity-log';
import { useActivityActions } from './actions';
import { transformActivityLogEntry } from './activity-transformer';
import { useActivityFields } from './fields';
import { extractActivityLogTypeValues } from './filters';
import { DEFAULT_VIEW } from './views';
import type { Activity, ActivityLogParams } from './types';
import type { Field, Filter, View } from '@wordpress/dataviews';

const ACTIVITY_LOGS_DEFAULT_PAGE_SIZE = 20;

interface InitialState {
	siteData?: {
		gmtOffset?: number;
		timezoneString?: string;
	};
}

declare global {
	const JPACTIVITYLOG_INITIAL_STATE: InitialState | undefined;
}

/**
 * Read the site's timezone/offset from the Initial_State payload seeded
 * by class-initial-state.php. Falls back to UTC when the global isn't
 * present (e.g. in storybook or tests).
 *
 * @return The resolved site time context.
 */
const readSiteTimeContext = (): { gmtOffset: number; timezoneString?: string } => {
	const state =
		typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined' ? JPACTIVITYLOG_INITIAL_STATE : undefined;
	return {
		gmtOffset: state?.siteData?.gmtOffset ?? 0,
		timezoneString: state?.siteData?.timezoneString || undefined,
	};
};

/**
 * The Activity Log admin page. Renders the DataViews table and drives
 * its dataset/filter/counts queries against /jetpack/v4/activity-log.
 *
 * @return The admin page.
 */
export default function ActivityLog() {
	const { gmtOffset, timezoneString } = readSiteTimeContext();
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	const activityLogTypeValues = useMemo( () => {
		const filters = ( view.filters as Filter[] | undefined ) ?? [];
		return extractActivityLogTypeValues( filters );
	}, [ view.filters ] );

	const searchTerm = view.search?.trim() ?? '';

	const listParams: ActivityLogParams = useMemo( () => {
		const params: ActivityLogParams = {
			sort_order: view.sort?.direction,
			number: view.perPage || ACTIVITY_LOGS_DEFAULT_PAGE_SIZE,
			page: view.page,
		};
		if ( searchTerm ) {
			params.text_search = searchTerm;
		}
		if ( activityLogTypeValues.length ) {
			params.group = activityLogTypeValues;
		}
		return params;
	}, [ view.sort?.direction, view.perPage, view.page, searchTerm, activityLogTypeValues ] );

	const {
		data: activityLogData,
		isFetching: isFetchingData,
		isLoading: isLoadingList,
	} = useQuery( {
		...activityLogQuery( listParams ),
		select: data => ( {
			...data,
			activityLogs: ( data.activityLogs ?? [] ).map( transformActivityLogEntry ),
		} ),
	} );

	// Counts query excludes `text_search` intentionally: keeping the filter
	// dropdown stable as users type (matches Calypso's behavior at
	// logs-activity/dataviews/index.tsx:100-102).
	const { data: groupCountsData, isFetching: isFetchingFilters } = useQuery(
		activityLogGroupCountsQuery( { number: 1000 } )
	);

	const isFetching = isFetchingData || isFetchingFilters;

	const paginationInfo = {
		totalItems: activityLogData?.totalItems ?? 0,
		totalPages: activityLogData?.totalPages ?? 0,
	};

	const fields = useActivityFields( {
		gmtOffset,
		timezoneString,
		activityLogTypes: groupCountsData?.groups,
	} );

	const actions = useActivityActions( { isLoading: isFetching } );

	const onChangeView = useCallback(
		( next: View ) => {
			const nextSearch = next.search?.trim() ?? '';
			const currentPage = view.page ?? 1;
			const requestedPage = next.page ?? currentPage;

			const perPageChanged = next.perPage !== view.perPage;
			const sortChanged = next.sort?.direction !== view.sort?.direction;
			const filtersChanged = ! fastDeepEqual( next.filters, view.filters );
			const searchChanged = nextSearch !== searchTerm;

			const datasetChanged = perPageChanged || sortChanged || filtersChanged || searchChanged;

			setView( {
				...next,
				page: datasetChanged ? 1 : requestedPage,
			} );
		},
		[ view, searchTerm ]
	);

	const resetView = useCallback( () => setView( DEFAULT_VIEW ), [] );

	const getItemId = useCallback( ( item: Activity ) => item.activityId.toString(), [] );

	const logData = ( activityLogData?.activityLogs ?? [] ) as Activity[];

	return (
		<DataViews< Activity >
			data={ logData }
			isLoading={ isFetching || isLoadingList }
			paginationInfo={ paginationInfo }
			fields={ fields as Field< Activity >[] }
			view={ view }
			actions={ actions }
			getItemId={ getItemId }
			search
			defaultLayouts={ { table: {} } }
			onChangeView={ onChangeView }
			onResetView={ resetView }
			empty={
				<p>
					{ view.search
						? __( 'No activity found', 'jetpack-activity-log' )
						: __( 'No activities', 'jetpack-activity-log' ) }
				</p>
			}
		/>
	);
}
