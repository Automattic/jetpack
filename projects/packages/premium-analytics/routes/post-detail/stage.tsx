import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { Button } from '@jetpack-premium-analytics/externals';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import {
	DateFiltersPanel,
	SectionTabPanel,
	safeHttpUrl,
	StatsBreadcrumbs,
	StatsPageIcon,
} from '@jetpack-premium-analytics/ui';
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { PostDetailTabs, PostSummaryCard } from './components';
import { POST_DETAIL_WIDGET_TYPE_ALIASES } from './config';
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

	const publicUrl = safeHttpUrl( summary.url );

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

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules );

	// The fixed compositions reuse registered widget types under page-local
	// aliases so each card carries its design title — the host titles a card
	// by its widget *type*. Each alias clones the resolved base type (render
	// module and all) under a variant name and title; see
	// `config/widget-variants`.
	const pageWidgetTypes = useMemo( () => {
		const aliases = POST_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { baseType, variants } ) => {
			const base = widgetTypes.find( widgetType => widgetType.name === baseType );

			return base
				? variants.map( variant => ( {
						...base,
						name: variant.name,
						title: variant.getTitle(),
						...( variant.icon ? { icon: variant.icon } : {} ),
				  } ) )
				: [];
		} );

		return aliases.length ? [ ...widgetTypes, ...aliases ] : widgetTypes;
	}, [ widgetTypes ] );

	// The single resource, date range, and comparison all live in the URL search
	// params, staged and committed by the shared date-filter controller.
	const dateFilters = useReportDateFilters( ROUTE_FROM );

	return (
		<GlobalErrorProvider>
			<WidgetDashboard
				widgetTypes={ pageWidgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				resolveWidgetModule={ resolveWidgetModuleWithI18n }
				layout={ layout }
				onLayoutChange={ noopLayoutChange }
				gridSettings={ POST_DETAIL_GRID }
			>
				<Page
					visual={ <StatsPageIcon /> }
					breadcrumbs={
						<StatsBreadcrumbs items={ summary.title ? [ { label: summary.title } ] : [] } />
					}
					actions={
						publicUrl ? (
							<Button
								variant="solid"
								tone="neutral"
								size="compact"
								nativeButton={ false }
								role="link"
								className={ styles.viewPost }
								render={ <a href={ publicUrl } target="_blank" rel="noopener noreferrer" /> }
							>
								{ summary.type === 'page'
									? __( 'View page', 'jetpack-premium-analytics-pkg' )
									: __( 'View post', 'jetpack-premium-analytics-pkg' ) }
							</Button>
						) : undefined
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
						 */ }
						<div className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } />
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
									{ activeTab === tab.id ? (
										<WidgetDashboard.Widgets className={ styles.widgets } />
									) : null }
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
