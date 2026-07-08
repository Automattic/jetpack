/**
 * Top-level Activity Log admin page. Ported from Calypso's
 * `client/dashboard/sites/logs-activity/dataviews/index.tsx`. Scope
 * simplifications vs. the source are tracked in the PR (#48244): view
 * state persists to localStorage rather than URL params, the actor
 * column isn't linked, and the "Manage backup" row action is stubbed
 * until #48236 lands.
 */
import { AdminPage } from '@automattic/jetpack-components';
import {
	ConnectionError,
	useConnectionErrorNotice,
	CONNECTION_STORE_ID,
} from '@automattic/jetpack-connection';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import fastDeepEqual from 'fast-deep-equal/es6';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	activityLogQuery,
	activityLogGroupCountsQuery,
	activityLogActorsQuery,
} from '../../hooks/use-activity-log';
import { useAnalytics } from '../../hooks/use-analytics';
import { usePersistentView } from '../../hooks/use-persistent-view';
import { DateRangePicker } from '../DateRangePicker';
import { formatYmd, parseYmdLocal } from '../DateRangePicker/datetime';
import { UpsellCallout } from './UpsellCallout';
import { useActivityActions } from './actions';
import { transformActivityLogEntry } from './activity-transformer';
import { useActivityFields } from './fields';
import { extractActivityLogTypeValues, extractActorIdValues } from './filters';
import { DEFAULT_LAYOUTS, DEFAULT_VIEW } from './views';
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

type ErrorNoticeState = {
	status: 'error' | 'warning';
	message: string;
};

/**
 * Pull a string message off whatever react-query handed us in `error`.
 * Anything else falls back to an empty string so the caller can swap in
 * the generic copy.
 *
 * @param error - Whatever value react-query stored in its `error` slot.
 * @return The extracted message, or `''` when none is present.
 */
const extractErrorMessage = ( error: unknown ): string => {
	if ( error && typeof error === 'object' && 'message' in error ) {
		return typeof error.message === 'string' ? error.message : '';
	}
	return '';
};

/**
 * Compute the error/warning notice to show above the DataViews table.
 *
 * @param isListError     - Whether the list query failed.
 * @param listError       - The raw error value from the list query.
 * @param hasAuxError     - Whether either the filters or actors query failed.
 * @param hasExistingRows - Whether the table is currently displaying previously-loaded rows.
 * @return The notice descriptor, or `null` when all queries succeeded.
 */
const buildErrorNotice = (
	isListError: boolean,
	listError: unknown,
	hasAuxError: boolean,
	hasExistingRows: boolean
): ErrorNoticeState | null => {
	if ( isListError ) {
		// A failed refetch keeps the previous rows on screen, so a red error notice would contradict them.
		if ( hasExistingRows ) {
			return {
				status: 'warning',
				message: __(
					'Couldn’t refresh the activity log. The events shown may be out of date.',
					'jetpack-activity-log'
				),
			};
		}
		const rawMessage = extractErrorMessage( listError );
		return {
			status: 'error',
			message: rawMessage
				? sprintf(
						/* translators: %s is the underlying error message returned by the server. */
						__( 'Couldn’t load the activity log: %s', 'jetpack-activity-log' ),
						rawMessage
				  )
				: __( 'Couldn’t load the activity log. Try refreshing the page.', 'jetpack-activity-log' ),
		};
	}
	if ( hasAuxError ) {
		return {
			status: 'warning',
			message: __(
				'Filter options are temporarily unavailable, but all events are loaded correctly.',
				'jetpack-activity-log'
			),
		};
	}
	return null;
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
	const wrapperRef = useRef< HTMLDivElement >( null );

	// On free tier, neutralize DataViews' real search + filter cluster
	// (the `.dataviews__search` Stack rendered by `DataViews`'s default
	// UI). We let DataViews ship its own toolbar so the page tracks
	// upstream changes for free, then mark the cluster `inert` — which
	// blocks pointer + keyboard interaction and removes descendants from
	// the a11y tree in one shot — and add a `title` attribute that
	// surfaces the upgrade nudge as a native browser tooltip on hover.
	// Tradeoff: Firefox suppresses `title` tooltips inside an inert
	// subtree, so the nudge doesn't appear there; accepted per #48527.
	// `MutationObserver` re-applies after DataViews remounts the toolbar
	// / re-renders the input (e.g., on initial fetch resolution or
	// layout switch) so React's render doesn't strip the attributes.
	useEffect( () => {
		if ( hasActivityLogsAccess ) {
			return;
		}

		const wrapper = wrapperRef.current;
		if ( ! wrapper ) {
			return;
		}

		const tooltipText = __( 'Upgrade your plan to use this feature.', 'jetpack-activity-log' );

		const apply = ( root: ParentNode ) => {
			const cluster = root.querySelector< HTMLElement >( '.dataviews__search' );
			if ( ! cluster || cluster.hasAttribute( 'inert' ) ) {
				return;
			}

			cluster.setAttribute( 'inert', '' );
			cluster.setAttribute( 'title', tooltipText );
		};

		apply( wrapper );
		const observer = new MutationObserver( () => apply( wrapper ) );
		observer.observe( wrapper, { subtree: true, childList: true } );

		return () => observer.disconnect();
	}, [ hasActivityLogsAccess ] );

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

	const actorIdValues = useMemo( () => {
		const filters = ( view.filters as Filter[] | undefined ) ?? [];
		return extractActorIdValues( filters );
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
			// `view.page` starts `undefined` and settles to `1` on the
			// first user-triggered change; defaulting here keeps the
			// query key stable across that transition so we don't fire
			// a duplicate list request on page load.
			page: view.page ?? 1,
			after: afterIso,
			before: beforeIso,
		};
		if ( searchTerm ) {
			params.text_search = searchTerm;
		}
		if ( activityLogTypeValues.length ) {
			params.group = activityLogTypeValues;
		}
		if ( actorIdValues.length ) {
			params.actor = actorIdValues;
		}
		return params;
	}, [
		view.sort?.direction,
		view.perPage,
		view.page,
		searchTerm,
		activityLogTypeValues,
		actorIdValues,
		afterIso,
		beforeIso,
	] );

	const {
		data: activityLogData,
		isFetching: isFetchingData,
		isLoading: isLoadingList,
		isError: isListError,
		error: listError,
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
	const {
		data: groupCountsData,
		isFetching: isFetchingFilters,
		isError: isFiltersError,
	} = useQuery(
		activityLogGroupCountsQuery( {
			number: 1000,
			after: afterIso,
			before: beforeIso,
		} )
	);

	// Actors query feeds the "Performed by" dropdown. Same date window as
	// the list / counts queries so the available options match what's on
	// screen, and intentionally independent of the current filter state so
	// selections don't shrink the dropdown to themselves.
	//
	// `number: 1000` matches the upstream REST schema's max for events
	// scanned. On very large windows where >1000 events exist, actors who
	// only appear beyond the scan horizon won't surface in the dropdown
	// — bumping that ceiling would need a coordinated change to the
	// Jetpack proxy and the WPCOM endpoint.
	const {
		data: actorsData,
		isFetching: isFetchingActors,
		isError: isActorsError,
	} = useQuery(
		activityLogActorsQuery( {
			number: 1000,
			after: afterIso,
			before: beforeIso,
		} )
	);

	const isFetching = isFetchingData || isFetchingFilters || isFetchingActors;

	const logData = ( activityLogData?.activityLogs ?? [] ) as Activity[];

	// When the list request fails, it may be because the site's connection to
	// WordPress.com is broken (the activity feed is proxied through a
	// user-token-signed WPCOM request). Reactively probe the connection health
	// check so a real broken-connection state surfaces an actionable notice
	// instead of a generic "couldn't load" dead-end. Never runs on mount — only
	// off a failure — so the multi-call probe stays off the happy path.
	const { runConnectionHealthCheck } = useDispatch( CONNECTION_STORE_ID );
	// Opt in to health-check errors: AL is the consumer that runs the probe, so it
	// is the one that should surface its result. Other consumers of the shared
	// hook default to `includeHealthErrors: false` and never inherit this slot.
	const { hasConnectionError } = useConnectionErrorNotice( { includeHealthErrors: true } );
	// Deliberately use a layout effect so the "generic" error notice never
	// paints before we begin the connection health check. A regular
	// useEffect produces a brief flash of the generic notice before it is
	// replaced by the actionable connection banner.
	const [ isCheckingHealth, setIsCheckingHealth ] = useState( false );
	useLayoutEffect( () => {
		let cancelled = false;

		if ( ! isListError ) {
			setIsCheckingHealth( false );
			return () => {
				cancelled = true;
			};
		}
		setIsCheckingHealth( true );
		// runConnectionHealthCheck always settles (its thunk try/catches to `{}`
		// or a mapped error), so the pending flag is guaranteed to clear.
		Promise.resolve( runConnectionHealthCheck() ).finally( () => {
			if ( ! cancelled ) {
				setIsCheckingHealth( false );
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ isListError, runConnectionHealthCheck ] );

	// Prefer the shared, actionable connection-error notice over the generic
	// one whenever the failure is attributable to a broken connection.
	const showConnectionError = isListError && hasConnectionError;
	// Hold the generic notice until the health probe resolves (so a broken
	// connection shows only the actionable banner) and until the list query
	// settles (so the aux warning doesn't flash before the list errors).
	const showGenericNotice = ! showConnectionError && ! isCheckingHealth && ! isLoadingList;

	// Surface request failures so a broken WPCOM round-trip doesn't read as "no events".
	const errorNotice = useMemo< ErrorNoticeState | null >(
		() =>
			buildErrorNotice(
				isListError,
				listError,
				isFiltersError || isActorsError,
				logData.length > 0
			),
		[ isListError, listError, isFiltersError, isActorsError, logData.length ]
	);

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
		actors: actorsData?.actors,
	} );

	const actions = useActivityActions( { isLoading: isFetching, tracks } );

	const onChangeView = useCallback(
		( next: View ) => {
			const nextSearch = next.search?.trim() ?? '';
			const currentPage = view.page ?? 1;
			const requestedPage = next.page ?? currentPage;

			const perPageChanged = next.perPage !== view.perPage;
			const sortChanged = next.sort?.direction !== view.sort?.direction;
			const filtersChanged = ! fastDeepEqual( next.filters, view.filters );
			const searchChanged = nextSearch !== searchTerm;
			const layoutChanged = next.type !== view.type;

			const datasetChanged = perPageChanged || sortChanged || filtersChanged || searchChanged;

			// Tracking — same breakdown Calypso records (per_page /
			// filter / search / page_changed), namespaced under
			// `jetpack_activity_log_*`, plus a wp-admin-only
			// `layout_changed` since Jetpack exposes the DataViews
			// Activity timeline as a second layout.
			if ( layoutChanged ) {
				tracks.recordEvent( 'jetpack_activity_log_layout_changed', {
					layout: next.type,
				} );
			}
			if ( perPageChanged ) {
				tracks.recordEvent( 'jetpack_activity_log_per_page_changed', {
					per_page: next.perPage,
				} );
			}
			if ( filtersChanged ) {
				const nextFilters = ( next.filters as Filter[] | undefined ) ?? [];
				const activityTypes = extractActivityLogTypeValues( nextFilters );
				const actorIds = extractActorIdValues( nextFilters );
				const eventProps: Record< string, boolean | number > = {
					num_groups_selected: activityTypes.length,
					num_actors_selected: actorIds.length,
					actor_filter_includes_mcp: actorIds.some( id => id.startsWith( 'mcp:' ) ),
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

	// Mounting the picker as an admin-ui `actions` slot places it in the
	// AdminPage header alongside the title/subtitle — matches MSD's
	// layout for the logs pages. On free tier the picker renders as a
	// disabled upgrade affordance (no popover, hover tooltip), keeping
	// the page surface visually consistent with the paid version.
	const headerActions = (
		<DateRangePicker
			start={ dateRange.start }
			end={ dateRange.end }
			onChange={ onChangeDateRange }
			timezoneString={ timezoneString }
			gmtOffset={ gmtOffset }
			locale={ locale }
			disabled={ ! hasActivityLogsAccess }
			disabledTooltipText={ __( 'Upgrade your plan to use this feature.', 'jetpack-activity-log' ) }
		/>
	);

	return (
		<AdminPage
			title={ __( 'Activity Log', 'jetpack-activity-log' ) }
			subTitle={ __(
				'Every change made to your site, in one searchable timeline.',
				'jetpack-activity-log'
			) }
			actions={ headerActions }
			showFooter={ false }
			unwrapped
		>
			<div
				ref={ wrapperRef }
				className={
					'jp-activity-log__dataviews-wrapper' +
					( hasActivityLogsAccess ? '' : ' jp-activity-log__dataviews-wrapper--free-tier' )
				}
			>
				{ /*
				 * Single inner div soaks up `jetpack-admin-page-layout`'s
				 * `.admin-ui-page > :not(...):not(...) > *` rule (which
				 * force-applies `flex: 1 1 auto; flex-direction: column`
				 * to every direct child of the page's scroll column).
				 * With the chain landing here, DataViews and the
				 * free-tier UpsellCallout are grandchildren and stack
				 * without competing for flex space — no `!important`
				 * overrides needed.
				 */ }
				<div className="jp-activity-log__inner">
					{ showConnectionError ? (
						<ConnectionError
							// `<ConnectionError>` re-runs `useConnectionErrorNotice`
							// internally, so it needs the same opt-in as the gate above
							// or it re-computes `hasConnectionError` as false and renders
							// nothing.
							includeHealthErrors
							context={ __(
								'Your activity log couldn’t load because your site isn’t fully connected to WordPress.com.',
								'jetpack-activity-log'
							) }
						/>
					) : (
						showGenericNotice &&
						errorNotice && (
							<Notice.Root intent={ errorNotice.status }>
								<Notice.Description>{ errorNotice.message }</Notice.Description>
							</Notice.Root>
						)
					) }
					<DataViews< Activity >
						data={ logData }
						isLoading={ isFetching || isLoadingList }
						paginationInfo={ paginationInfo }
						fields={ fields as Field< Activity >[] }
						view={ view }
						actions={ actions }
						getItemId={ getItemId }
						search
						// Advertise both DataViews' built-in Activity timeline
						// (the default) and a Table layout. Toggle lives in
						// the cog popover's layout switcher. Each layout maps
						// the event parts to the right slots:
						//   - Activity: `event_icon` → mediaField (left
						//     bullet slot), `event_title` → titleField,
						//     `event_description` → descriptionField, plus
						//     `groupBy: published_date` for day headers.
						//   - Table: one composite `event` column alongside
						//     Date / User.
						// See DEFAULT_LAYOUTS in ./views for the full shape —
						// it explicitly nulls slot/groupBy refs on Table so a
						// round-trip Activity → Table doesn't carry those
						// over and double-render as a primary column.
						defaultLayouts={ DEFAULT_LAYOUTS }
						onChangeView={ onChangeView }
						onReset={ isViewModified ? onResetView : false }
						// On the free tier, lock the perPage selector to the
						// capped size. DataViews keeps rendering its real
						// toolbar (search + filter toggle + cog); the
						// search/filter cluster is neutralized by the
						// `aria-disabled` + `tabindex="-1"` overlay
						// applied in the effect above — Calypso's
						// equivalent switch at logs-activity/dataviews/
						// index.tsx:201-208 hides them, but we want the
						// upgrade affordance to be discoverable on hover.
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
					/>
					{ ! hasActivityLogsAccess && ! isFetching && logData.length > 0 && <UpsellCallout /> }
				</div>
			</div>
		</AdminPage>
	);
}
