import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
// Grid settings are intentionally shared across analytics dashboards (see the
// hook's own note), so the post-detail page reuses the dashboard's hook rather
// than storing a separate copy.
import { useDashboardGridSettings } from '../dashboard/hooks/use-dashboard-grid-settings';
import { PostDetailTabs, PostSummaryCard } from './components';
import { getPostDetailTabs, type PostDetailTabId } from './config';
import { useActiveTab, usePostDetailTabLayout, usePostSummary } from './hooks';
import { route } from './package.json';
import styles from './stage.module.scss';

const ROUTE_FROM = route.path;

/**
 * Premium Analytics post/page detail page stage component.
 *
 * Mirrors the dashboard — customizable, per-tab widget grids driven by a shared
 * date range and comparison — but is scoped to a single post/page and carries
 * its own header (breadcrumb + summary card) and tab set.
 *
 * @return {JSX.Element} The post detail page.
 */
function PostDetail(): JSX.Element {
	const { postId: postIdParam } = useParams( { from: ROUTE_FROM } ) as { postId?: string };
	const postId = Number( postIdParam );

	const tabs = useMemo( () => getPostDetailTabs(), [] );
	const [ activeTab, setActiveTab ] = useActiveTab();
	const [ layout, setLayout, resetLayout ] = usePostDetailTabLayout( activeTab );
	const [ gridSettings ] = useDashboardGridSettings();

	const summary = usePostSummary( postId );

	const widgetModules = useSelect(
		select =>
			(
				select( coreStore ) as unknown as {
					getEntityRecords: ( kind: string, name: string ) => WidgetModuleRecord[] | null;
				}
			 ).getEntityRecords( 'root', 'widgetModule' ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypes( widgetModules );

	const [ editMode, setEditMode ] = useState( false );

	// Switching tabs returns to view mode. Edit mode is page-level, and an empty
	// tab force-enables it via the dashboard provider's empty-layout effect, so
	// without this a non-empty tab would stay stuck in customize view after
	// visiting an empty one.
	const handleTabChange = useCallback(
		( id: PostDetailTabId ) => {
			setEditMode( false );
			setActiveTab( id );
		},
		[ setActiveTab ]
	);

	// The single resource, date range, and comparison all live in the URL search
	// params, staged and committed by the shared date-filter controller.
	const dateFilters = useReportDateFilters( ROUTE_FROM );

	// The breadcrumb's "Stats" crumb links back to the dashboard, carrying the
	// current date range and comparison so returning restores the same view.
	const dashboardLink = useDashboardLink();

	// Container element for the date filters panel responsive layout.
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<GlobalErrorProvider>
			{ /*
			 * Key the dashboard by the active tab so its staging layout resets on
			 * every switch. Empty tabs otherwise share one `EMPTY_LAYOUT` identity,
			 * and the provider only resets staging when the `layout` prop identity
			 * changes — so staged-but-unsaved widgets could render on, and be saved
			 * under, the wrong tab. Remount cost is negligible (only the active
			 * tab's panel renders).
			 */ }
			<WidgetDashboard
				key={ activeTab }
				widgetTypes={ widgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				layout={ layout }
				onLayoutChange={ setLayout }
				onLayoutReset={ resetLayout }
				gridSettings={ gridSettings }
				editMode={ editMode }
				onEditChange={ setEditMode }
			>
				<Page
					breadcrumbs={
						<Breadcrumbs
							items={ [
								{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
								...( summary.title ? [ { label: summary.title } ] : [] ),
							] }
						/>
					}
					actions={ <WidgetDashboard.Actions /> }
					className={ styles.page }
				>
					<PostDetailTabs tabs={ tabs } value={ activeTab } onChange={ handleTabChange }>
						{ /*
						 * The summary card and date filters are shared by every tab
						 * (same post, same date range), so they render once below the
						 * tab bar and above the per-tab widget grid.
						 *
						 * The date-filters wrapper is also the responsive-measurement
						 * target: DateFiltersPanel reads its width to pick mobile/wide
						 * layouts instead of relying on the viewport.
						 */ }
						<div className={ styles.summary }>
							<PostSummaryCard summary={ summary } />
						</div>
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
						</div>
						{ tabs.map( tab => (
							<Tabs.Panel key={ tab.id } value={ tab.id } className={ styles.content }>
								{ activeTab === tab.id ? (
									<>
										<WidgetDashboard.NoWidgetsState />
										<WidgetDashboard.Widgets />
									</>
								) : null }
							</Tabs.Panel>
						) ) }
					</PostDetailTabs>

					<WidgetDashboard.Commands />
				</Page>
			</WidgetDashboard>
		</GlobalErrorProvider>
	);
}

/**
 * Route stage wrapper.
 *
 * The header summary fetches through React Query at the page level (widgets get
 * their own client inside each WidgetRoot), so the page mounts its own
 * AnalyticsQueryClientProvider above the component that reads it.
 *
 * @return {JSX.Element} The post detail page.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<PostDetail />
		</AnalyticsQueryClientProvider>
	);
}
