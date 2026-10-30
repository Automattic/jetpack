/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { Badge, Icon } from '@jetpack-premium-analytics/externals';
import { jetpack, lookupWidgetIcon } from '@jetpack-premium-analytics/icons';
import {
	DashboardWidgetHostProvider,
	decodeDateSearchParam,
	omitReportDateParams,
	pickReportDateParams,
	pickReportNavigationParams,
	useDashboardLink,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import { StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	DetailPageActions,
	PageNotice,
	describeError,
	useDetailPageCustomize,
	useHostLinkSearch,
	useStoredDetailLayout,
	useTrackedDateRangeApply,
	type PageNoticeProps,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, useNavigate, useParams, useSearch } from '@wordpress/route';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */
import { DETAIL_GRID } from '../grid';
import { getReportDefinition } from '../reports/registry';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { useWidgetModules } from '../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { SinglePageLayout } from './components';
import { buildControlFields, type ControlsItem } from './controls';
import { route } from './package.json';
import { getSingleReportAdapter, type EntitySummary, type SingleReportAdapter } from './pages';
import {
	getSingleReportLayout,
	getSingleReportPage,
	resolveSingleReportControls,
	resolveSingleReportSection,
	type SingleReportPageRecord,
} from './registry';
import styles from './stage.module.scss';
import type { PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

// The record's icon at the size of the media it stands in for.
const ICON_SIZE = 28;

const READY_SUMMARY: EntitySummary = {
	isLoading: false,
	isError: false,
	error: undefined,
	isNotFound: false,
	refetch: () => {},
};

// A page the route ships no adapter for renders from its record: the label titles it.
const RECORD_ADAPTER: SingleReportAdapter = {
	useSummary: () => READY_SUMMARY,
	headerSlots: ( summary, { label } ) => ( { title: label } ),
};

type SingleReportBodyProps = {
	/*
	 * The registered page the URL names.
	 */
	page: SingleReportPageRecord;

	/*
	 * The entity the page is about, as the URL carries it.
	 */
	entityId: string;

	/*
	 * The page's adapter, or the record-only one.
	 */
	adapter: SingleReportAdapter;
};

/**
 * The page: header, its controls and the composition the record declares.
 *
 * @param {SingleReportBodyProps} props - The props.
 * @return The page.
 */
function SingleReportBody( { page, entityId, adapter }: SingleReportBodyProps ): JSX.Element {
	const summary = adapter.useSummary( entityId );

	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const section = resolveSingleReportSection( page, search?.section as string | undefined );
	const defaultLayout = getSingleReportLayout( page, section );

	const widgetModules = useWidgetModules();
	const resolveWidgetModule = useWidgetModuleResolver( widgetModules );
	const visibleNames = useMemo(
		() => [ ...new Set( defaultLayout.map( widget => widget.type ) ) ],
		[ defaultLayout ]
	);
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames,
	} );

	const surface = `${ page.path }_detail` as const;

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { isAnchoringAllTime } = useDetailDateControls(
		summary.allTimeStart,
		dateFilters,
		summary.isLoading || summary.isError
	);

	const { trackedOnChange, trackedOnApply } = useTrackedDateRangeApply(
		{
			presetId: dateFilters.presetId,
			range: dateFilters.range,
			interval: dateFilters.interval,
			comparisonPresetId: dateFilters.comparisonPresetId,
			appliedComparisonRange: dateFilters.appliedComparisonRange,
		},
		{ surface, offersComparison: false }
	);

	const controls = resolveSingleReportControls( page, section );
	const controlFields = useMemo( () => buildControlFields( controls ), [ controls ] );
	const controlsData = useMemo< ControlsItem >(
		() => ( {
			reportParams: pickReportDateParams( search ),
			allTimeStart: summary.allTimeStart,
		} ),
		[ search, summary.allTimeStart ]
	);

	// A committed window goes to the URL, where every widget on the page reads it.
	const applyReportParams = useCallback(
		( edits: Record< string, unknown > ) => {
			const next = edits.reportParams as Record< string, unknown > | undefined;
			if ( ! next ) {
				return;
			}
			trackedOnChange(
				{
					from: decodeDateSearchParam( next.from as string | undefined ),
					to: decodeDateSearchParam( next.to as string | undefined ),
				},
				next.preset as PrimaryPresetId | undefined
			);
			trackedOnApply();
			void navigate( {
				to: ROUTE_FROM,
				params: { kind: page.path, id: entityId } as unknown as never,
				search: ( ( previous: Record< string, unknown > ) => ( {
					...omitReportDateParams( previous ),
					...next,
				} ) ) as unknown as never,
			} );
		},
		[ navigate, page.path, entityId, trackedOnChange, trackedOnApply ]
	);

	const reportSearch = pickReportNavigationParams( search );

	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		page.preferences_scope,
		section?.slug ?? page.path,
		defaultLayout
	);
	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;
	const {
		isCustomizing,
		canCustomize,
		canPerform,
		startCustomizing,
		resetToDefault,
		onEditChange,
		onLayoutChange,
	} = useDetailPageCustomize( layout, {
		enabled: canRenderWidgets,
		onLayoutReset: resetLayout,
		onLayoutChange: setLayout,
		surface,
	} );

	const dashboardLink = useDashboardLink();
	const breadcrumbs = useDetailBreadcrumbs(
		canRenderWidgets ? summary.title?.trim() || page.label : undefined,
		page.reports_page ?? undefined
	);

	// The trail starts at the dashboard; an unlinked final crumb is the page heading.
	const trail = (
		<div className={ styles.trail }>
			<Breadcrumbs
				items={ [
					{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
					...breadcrumbs,
				] }
			/>
		</div>
	);

	const header = adapter.headerSlots( summary, {
		label: page.label,
		section,
		performanceRange: dateFilters.appliedRange,
	} );
	const recordIcon = ( page.icon && lookupWidgetIcon( page.icon ) ) || jetpack;
	const reportsPage = page.reports_page ? getReportDefinition( page.reports_page ) : undefined;

	let notice: PageNoticeProps | null = null;
	if ( summary.isError ) {
		notice = describeError( summary.error, {
			retryDescription: __(
				"We couldn't load this page. Please try again in a moment.",
				'jetpack-premium-analytics-pkg'
			),
			onRetry: summary.refetch,
		} );
	} else if ( summary.isNotFound ) {
		notice = {
			intent: 'info',
			description:
				adapter.notFoundDescription?.() ??
				__( "We couldn't find what you were looking for.", 'jetpack-premium-analytics-pkg' ),
			...( reportsPage
				? {
						link: {
							label: sprintf(
								/* translators: %s: the reports page's name, e.g. "Videos". */
								__( 'Back to %s', 'jetpack-premium-analytics-pkg' ),
								reportsPage.getLabel()
							),
							render: (
								<Link
									to="/reports/$report"
									params={ { report: reportsPage.id } as unknown as never }
									search={ reportSearch as unknown as never }
								/>
							),
						},
					}
				: {} ),
		};
	}

	return (
		<ReportScopeProvider offersComparison={ false }>
			<DashboardWidgetHostProvider useLinkSearch={ useHostLinkSearch }>
				<WidgetDashboard.Policy canPerform={ canPerform }>
					<WidgetDashboard
						widgetTypes={ widgetTypes }
						isResolvingWidgetTypes={ isResolvingWidgetTypes }
						resolveWidgetModule={ resolveWidgetModule }
						layout={ layout }
						onLayoutChange={ onLayoutChange }
						onLayoutReset={ resetLayout }
						gridSettings={ DETAIL_GRID }
						editMode={ isCustomizing }
						onEditChange={ onEditChange }
					>
						<Page
							className={ styles.page }
							visual={ <StatsPageIcon /> }
							breadcrumbs={ trail }
							badges={
								isCustomizing ? (
									<Badge intent="informational">
										{ __( 'Customizing', 'jetpack-premium-analytics-pkg' ) }
									</Badge>
								) : undefined
							}
							actions={
								<>
									{ adapter.headerActions?.( summary ) }
									<DetailPageActions
										isCustomizing={ isCustomizing }
										onCustomize={ canCustomize ? startCustomizing : undefined }
										onReset={ resetToDefault }
										editingActions={ <WidgetDashboard.Actions /> }
									/>
								</>
							}
						>
							<SinglePageLayout
								visual={ header.visual ?? <Icon icon={ recordIcon } size={ ICON_SIZE } /> }
								title={ header.title }
								subTitle={ header.subTitle }
								busy={ header.busy }
								controls={ controlFields as never }
								data={ controlsData }
								onChange={ applyReportParams }
							>
								{ canRenderWidgets && ! isAnchoringAllTime ? <WidgetDashboard.Widgets /> : null }
								{ notice ? <PageNotice { ...notice } /> : null }
							</SinglePageLayout>
						</Page>
					</WidgetDashboard>
				</WidgetDashboard.Policy>
			</DashboardWidgetHostProvider>
		</ReportScopeProvider>
	);
}

/**
 * Resolves the page the URL names and its adapter, then renders the body.
 *
 * @return The page, or nothing for a page the guard already rejected.
 */
function SingleReport(): JSX.Element | null {
	const { kind, id } = useParams( { from: ROUTE_FROM } ) as { kind?: string; id?: string };
	const page = getSingleReportPage( kind );

	if ( ! page || ! id ) {
		// The route guard already sent an unknown page or id to the dashboard.
		return null;
	}

	return (
		<SingleReportBody
			// Another page is another adapter, so another hook order: remount.
			key={ page.path }
			page={ page }
			entityId={ id }
			adapter={ getSingleReportAdapter( page.path ) ?? RECORD_ADAPTER }
		/>
	);
}

/**
 * The route's stage.
 *
 * @return The single-report page with its providers.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<SingleReport />
		</AnalyticsQueryClientProvider>
	);
}
