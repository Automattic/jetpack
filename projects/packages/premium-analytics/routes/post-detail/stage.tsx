import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel, SectionTabPanel } from '@jetpack-premium-analytics/ui';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { PostDetailTabs, PostSummaryCard } from './components';
import { EMAIL_WIDGET_TYPE_ALIASES } from './config';
import { usePostDetailTabs, usePostSummary } from './hooks';
import { route } from './package.json';
import styles from './stage.module.scss';

const ROUTE_FROM = route.path;

// The post-detail composition is fixed (WOOA7S-1622) and laid out against the
// small (200px) row height used by the design. Keep its grid independent from
// the customizable main-dashboard preference so a future settings control
// cannot stretch these tiles out of proportion.
const POST_DETAIL_GRID = { ...DEFAULT_GRID, rowHeight: ROW_HEIGHT_PRESETS.small };

// The layout is fixed, so the change callback never fires; the dashboard
// still requires one because it owns a staging copy internally.
const noopLayoutChange = () => {};

/**
 * Premium Analytics post/page detail page stage component.
 *
 * A fixed, non-customizable page (WOOA7S-1622): each tab renders the widget
 * composition from `POST_DETAIL_TAB_LAYOUTS`, scoped to a single post/page
 * and driven by a shared date range and comparison, with its own header
 * (breadcrumb + summary card) and tab set. There is no edit mode — required
 * widgets and their sizing cannot be removed or reshaped.
 *
 * @return {JSX.Element} The post detail page.
 */
function PostDetail(): JSX.Element {
	const { postId: postIdParam } = useParams( { from: ROUTE_FROM } ) as { postId?: string };
	const postId = Number( postIdParam );

	const { tabs, activeTab, setActiveTab, layout } = usePostDetailTabs( postId );

	const summary = usePostSummary( postId );

	const widgetModules = useSelect(
		select =>
			(
				select( coreStore ) as unknown as {
					getEntityRecords: (
						kind: string,
						name: string,
						query?: Record< string, unknown >
					) => WidgetModuleRecord[] | null;
				}
			 )
				// `per_page: -1` returns every widget type. Without it, core-data's
				// default query (`per_page: 10`) caps the records at 10 and could
				// silently drop the widgets this page's fixed layout requires.
				.getEntityRecords( 'root', 'widgetModule', { per_page: -1 } ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypes( widgetModules );

	// The fixed email compositions reuse registered widget types under
	// page-local aliases so each card carries its design title — the host
	// titles a card by its widget *type*. Each alias clones the resolved base
	// type (render module and all) under a variant name and title; see
	// `config/email-widget-variants`.
	const pageWidgetTypes = useMemo( () => {
		const aliases = EMAIL_WIDGET_TYPE_ALIASES.flatMap( ( { baseType, variants } ) => {
			const base = widgetTypes.find( widgetType => widgetType.name === baseType );

			return base
				? variants.map( variant => ( {
						...base,
						name: variant.name,
						title: variant.getTitle(),
				  } ) )
				: [];
		} );

		return aliases.length ? [ ...widgetTypes, ...aliases ] : widgetTypes;
	}, [ widgetTypes ] );

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
			<WidgetDashboard
				widgetTypes={ pageWidgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				layout={ layout }
				onLayoutChange={ noopLayoutChange }
				gridSettings={ POST_DETAIL_GRID }
			>
				<Page
					breadcrumbs={
						<Breadcrumbs
							items={ [
								{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
								...( summary.title ? [ { label: summary.title } ] : [] ),
							] }
						/>
					}
					className={ styles.page }
				>
					<PostDetailTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab }>
						{ /*
						 * The date filters and the summary card are shared by every tab
						 * (same post, same date range), so they render once below the
						 * tab bar and above the per-tab widget grid. The tab bar and the
						 * filters stay fixed outside the scroll container, exactly like
						 * the dashboard's section tabs; the summary header scrolls away
						 * inside it with the widgets, giving them the vertical room.
						 *
						 * The filters wrapper is also the responsive-measurement
						 * target: DateFiltersPanel reads its width to pick mobile/wide
						 * layouts instead of relying on the viewport.
						 */ }
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
						</div>
						<div className={ styles.scrollArea }>
							<div className={ styles.header }>
								<PostSummaryCard
									summary={ summary }
									performanceRange={ dateFilters.appliedRange }
								/>
							</div>
							{ tabs.map( tab => (
								<SectionTabPanel key={ tab.id } value={ tab.id } className={ styles.content }>
									{ activeTab === tab.id ? <WidgetDashboard.Widgets /> : null }
								</SectionTabPanel>
							) ) }
						</div>
					</PostDetailTabs>
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
