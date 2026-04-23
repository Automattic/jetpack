/**
 * Top-level Activity Log admin page. Ported from Calypso's
 * `client/dashboard/sites/logs-activity/dataviews/index.tsx`. Scope
 * simplifications vs. the source are tracked in the PR (#48244): view
 * state persists to localStorage rather than URL params, the actor
 * column isn't linked, and the "Manage backup" row action is stubbed
 * until #48236 lands.
 */
import { AdminPage } from '@automattic/jetpack-components';
import { useQuery } from '@tanstack/react-query';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import fastDeepEqual from 'fast-deep-equal/es6';
import { useCallback, useMemo, useState } from 'react';
import { activityLogQuery, activityLogGroupCountsQuery } from '../../hooks/use-activity-log';
import { useAnalytics } from '../../hooks/use-analytics';
import { usePersistentView } from '../../hooks/use-persistent-view';
import { DateRangePicker } from '../DateRangePicker';
import { formatYmd, parseYmdLocal } from '../DateRangePicker/datetime';
import { UpsellCallout } from './UpsellCallout';
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
		hasActivityLogsAccess?: boolean;
		locale?: string;
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
const readSiteTimeContext = (): {
	gmtOffset: number;
	timezoneString?: string;
	locale: string;
} => {
	const state =
		typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined' ? JPACTIVITYLOG_INITIAL_STATE : undefined;
	return {
		gmtOffset: state?.siteData?.gmtOffset ?? 0,
		timezoneString: state?.siteData?.timezoneString || undefined,
		// Fall back to the browser's navigator locale if Initial_State
		// didn't seed one — the picker's date labels only care about
		// number/weekday formatting.
		locale:
			state?.siteData?.locale || ( typeof navigator !== 'undefined' ? navigator.language : 'en' ),
	};
};

/**
 * Read the paid-plan capability flag seeded by Initial_State. Defaults
 * to `true` when the global isn't present (storybook/tests) so the
 * free-tier gating path only activates from a real backend signal.
 *
 * @return Whether the site has full Activity Log access.
 */
const readHasActivityLogsAccess = (): boolean => {
	if ( typeof JPACTIVITYLOG_INITIAL_STATE === 'undefined' ) {
		return true;
	}
	return JPACTIVITYLOG_INITIAL_STATE?.siteData?.hasActivityLogsAccess !== false;
};

/**
 * The Activity Log admin page. Renders the DataViews table and drives
 * its dataset/filter/counts queries against /jetpack/v4/activity-log.
 *
 * @return The admin page.
 */
export default function ActivityLog() {
	const { gmtOffset, timezoneString, locale } = readSiteTimeContext();
	const hasActivityLogsAccess = readHasActivityLogsAccess();
	const { view, setView, resetView, isViewModified } = usePersistentView( DEFAULT_VIEW );
	const { tracks } = useAnalytics();

	// Date-range defaults to "Last 7 days" anchored at the site's calendar
	// today (not the browser's) — matches Calypso's `getDefaultDateRange`.
	// The range is client-only state: refreshes reset to the default
	// instead of persisting, so users don't return to a stale narrow
	// window.
	const [ dateRange, setDateRange ] = useState( () => {
		const siteToday =
			parseYmdLocal( formatYmd( new Date(), timezoneString, gmtOffset ) ) ?? new Date();
		return {
			start: new Date( siteToday.getFullYear(), siteToday.getMonth(), siteToday.getDate() - 6 ),
			end: siteToday,
		};
	} );

	const activityLogTypeValues = useMemo( () => {
		const filters = ( view.filters as Filter[] | undefined ) ?? [];
		return extractActivityLogTypeValues( filters );
	}, [ view.filters ] );

	const searchTerm = view.search?.trim() ?? '';

	// The picker hands us start-of-day / end-of-day Dates at local-midnight
	// (see the `dateRange` initializer below). For the WPCOM query, stretch
	// `end` to the end of its calendar day so single-day ranges like "Today"
	// aren't empty (UTC midnight → UTC midnight would match no events).
	const afterIso = useMemo( () => dateRange.start.toISOString(), [ dateRange.start ] );
	const beforeIso = useMemo( () => {
		const endOfDay = new Date( dateRange.end );
		endOfDay.setHours( 23, 59, 59, 999 );
		return endOfDay.toISOString();
	}, [ dateRange.end ] );

	const listParams: ActivityLogParams = useMemo( () => {
		const params: ActivityLogParams = {
			sort_order: view.sort?.direction,
			number: view.perPage || ACTIVITY_LOGS_DEFAULT_PAGE_SIZE,
			page: view.page,
			after: afterIso,
			before: beforeIso,
		};
		if ( searchTerm ) {
			params.text_search = searchTerm;
		}
		if ( activityLogTypeValues.length ) {
			params.group = activityLogTypeValues;
		}
		return params;
	}, [
		view.sort?.direction,
		view.perPage,
		view.page,
		searchTerm,
		activityLogTypeValues,
		afterIso,
		beforeIso,
	] );

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

	// Counts query scopes to the same date window as the list (so
	// filter counts match what's displayed), but excludes `text_search`
	// so the filter dropdown stays stable as users type (matches
	// Calypso's behavior at logs-activity/dataviews/index.tsx:100-102).
	const { data: groupCountsData, isFetching: isFetchingFilters } = useQuery(
		activityLogGroupCountsQuery( {
			number: 1000,
			after: afterIso,
			before: beforeIso,
		} )
	);

	const isFetching = isFetchingData || isFetchingFilters;

	const paginationInfo = {
		totalItems: activityLogData?.totalItems ?? 0,
		// Zero `totalPages` on the free tier to hide DataViews' pagination
		// controls. The server-side clamp in REST_Controller already caps
		// the returned set at FREE_TIER_ITEM_CAP; this just keeps the UI
		// honest.
		totalPages: hasActivityLogsAccess ? activityLogData?.totalPages ?? 0 : 0,
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

			// Tracking — same breakdown Calypso records (per_page /
			// filter / search / page_changed), namespaced under
			// `jetpack_activity_log_*`.
			if ( perPageChanged ) {
				tracks.recordEvent( 'jetpack_activity_log_per_page_changed', {
					per_page: next.perPage,
				} );
			}
			if ( filtersChanged ) {
				const activityTypes = extractActivityLogTypeValues(
					( next.filters as Filter[] | undefined ) ?? []
				);
				const eventProps: Record< string, boolean | number > = {
					num_groups_selected: activityTypes.length,
				};
				let totalActivitiesSelected = 0;
				Object.entries( groupCountsData?.groups ?? {} ).forEach( ( [ groupKey, { count } ] ) => {
					const isSelected = activityTypes.includes( groupKey );
					eventProps[ `group_${ groupKey }` ] = isSelected;
					if ( isSelected ) {
						totalActivitiesSelected += count ?? 0;
					}
				} );
				eventProps.num_total_activities_selected = totalActivitiesSelected;
				tracks.recordEvent( 'jetpack_activity_log_filter_changed', eventProps );
			}
			if ( searchChanged ) {
				tracks.recordEvent( 'jetpack_activity_log_search', {
					has_query: nextSearch.length > 0,
				} );
			}
			if ( ! datasetChanged && requestedPage !== currentPage ) {
				tracks.recordEvent( 'jetpack_activity_log_page_changed', {
					page: requestedPage,
				} );
			}

			setView( {
				...next,
				page: datasetChanged ? 1 : requestedPage,
			} );
		},
		[ setView, view, searchTerm, tracks, groupCountsData ]
	);

	const onChangeDateRange = useCallback(
		( next: { start: Date; end: Date } ) => {
			const daysInRange =
				Math.round( ( next.end.getTime() - next.start.getTime() ) / 86_400_000 ) + 1;
			tracks.recordEvent( 'jetpack_activity_log_date_range_changed', {
				days_in_range: daysInRange,
			} );
			// A new range is its own dataset boundary — snap back to
			// page 1, matching how `onChangeView` handles other dataset
			// changes (perPage, sort, filters, search).
			setDateRange( next );
			setView( { ...view, page: 1 } );
		},
		[ setView, view, tracks ]
	);

	const onResetView = useCallback( () => {
		tracks.recordEvent( 'jetpack_activity_log_reset_view_click', {} );
		resetView();
	}, [ resetView, tracks ] );

	const getItemId = useCallback( ( item: Activity ) => item.activityId.toString(), [] );

	const logData = ( activityLogData?.activityLogs ?? [] ) as Activity[];

	// Mounting the picker as an admin-ui `actions` slot places it in the
	// AdminPage header alongside the title/subtitle — matches MSD's
	// layout for the logs pages.
	const headerActions = hasActivityLogsAccess ? (
		<DateRangePicker
			start={ dateRange.start }
			end={ dateRange.end }
			onChange={ onChangeDateRange }
			timezoneString={ timezoneString }
			gmtOffset={ gmtOffset }
			locale={ locale }
		/>
	) : undefined;

	return (
		<AdminPage
			title={ __( 'Activity Log', 'jetpack-activity-log' ) }
			subTitle={ __(
				'Every change made to your site, in one searchable timeline.',
				'jetpack-activity-log'
			) }
			actions={ headerActions }
			showFooter={ false }
		>
			<div className="jp-activity-log__dataviews-wrapper">
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
					onReset={ isViewModified ? onResetView : false }
					// On the free tier, lock the perPage selector to the
					// capped size and hide search/filters/sort/view-config
					// by replacing the default UI with just the table (same
					// switches Calypso uses at logs-activity/dataviews/
					// index.tsx:201-208).
					config={
						hasActivityLogsAccess
							? undefined
							: { perPageSizes: [ ACTIVITY_LOGS_DEFAULT_PAGE_SIZE ] }
					}
					empty={
						<p>
							{ view.search
								? __( 'No activity found', 'jetpack-activity-log' )
								: __( 'No activities', 'jetpack-activity-log' ) }
						</p>
					}
				>
					{ hasActivityLogsAccess ? undefined : <DataViews.Layout /> }
				</DataViews>
				{ ! hasActivityLogsAccess && ! isFetching && logData.length > 0 && <UpsellCallout /> }
			</div>
		</AdminPage>
	);
}
