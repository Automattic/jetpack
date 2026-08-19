import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { Button } from '@jetpack-premium-analytics/externals';
import { ReportScopeProvider, useReportDateFilters } from '@jetpack-premium-analytics/routing';
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
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { PostDetailTabs, PostSummaryCard } from './components';
import { EMAIL_TAB_IDS, POST_DETAIL_WIDGET_TYPE_ALIASES } from './config';
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

// The share of the header row the date filter presets can never use: the
// summary's 400px `min-inline-size` floor plus the row's 16px gap (see
// `.summary` and `.header` in stage.module.scss — keep the three in sync),
// plus a 24px buffer so the panel steps down before the wrap threshold —
// layout wraps synchronously while the measured layout flip lags a frame, so
// equal thresholds would flash a wrapped row at every boundary.
const HEADER_RESERVED_INLINE_SIZE = 440;

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

	// The header row hosts the panel in a shrink-to-fit slot, so the panel
	// measures the row itself to pick its responsive layout; see the
	// `containerElement` prop.
	const [ headerElement, setHeaderElement ] = useState< HTMLElement | null >( null );

	const breadcrumbs = useDetailBreadcrumbs( summary.title );

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
					breadcrumbs={ <StatsBreadcrumbs items={ breadcrumbs } /> }
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
						<div className={ styles.scrollArea }>
							{ /*
							 * The summary card and the date filter presets share the
							 * header row — title on the left, presets on the right, per
							 * the design mocks. Both are shared by every tab (same post,
							 * same date range), so they render once above the per-tab
							 * widget grid and scroll away with it.
							 */ }
							<div ref={ setHeaderElement } className={ styles.header }>
								<div className={ styles.summary }>
									{ /* The email tabs give the shared header an email identity
									     (envelope tile, "Email sent on …") while the title and
									     performance window stay the post's. */ }
									<PostSummaryCard
										summary={ summary }
										variant={ EMAIL_TAB_IDS.includes( activeTab ) ? 'email' : 'post' }
										performanceRange={ dateFilters.appliedRange }
									/>
								</div>
								<div className={ styles.dateFilters }>
									{ /*
									 * The design has no period-over-period comparison on
									 * this page, so the Compare control is opted out;
									 * comparison params stay in the URL so the breadcrumb
									 * carries them back to the dashboard. What keeps the
									 * widgets from reading them is the report scope the
									 * stage declares, not this prop.
									 */ }
									<DateFiltersPanel
										{ ...dateFilters }
										showComparison={ false }
										containerElement={ headerElement }
										reservedInlineSize={ HEADER_RESERVED_INLINE_SIZE }
									/>
								</div>
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
			{ /*
			 * The page names no compared period and offers no control for one, so
			 * nothing below may fetch or draw a comparison. The params stay on the
			 * URL so the breadcrumb carries the dashboard's state back out.
			 */ }
			<ReportScopeProvider offersComparison={ false }>
				<PostDetail />
			</ReportScopeProvider>
		</AnalyticsQueryClientProvider>
	);
}
