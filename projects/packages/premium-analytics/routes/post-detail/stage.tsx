import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { LinkButton } from '@jetpack-premium-analytics/externals';
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
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { PostDetailTabs, PostSummaryCard } from './components';
import { EMAIL_TAB_IDS, POST_DETAIL_WIDGET_TYPE_ALIASES } from './config';
import { usePostDetailTabs, usePostSummary } from './hooks';
import { route } from './package.json';
import styles from './stage.module.scss';

const ROUTE_FROM = route.path;

// Fixed composition (WOOA7S-1622): grid stays independent from the
// customizable main-dashboard preference so it can't be stretched.
const POST_DETAIL_GRID = { ...DEFAULT_GRID, rowHeight: ROW_HEIGHT_PRESETS.small };

// The layout is fixed, so the change callback never fires; the dashboard
// still requires one because it owns a staging copy internally.
const noopLayoutChange = () => {};

// = summary's min-inline-size + row gap (keep in sync with stage.module.scss)
// + a buffer, so the panel steps down before CSS wrap — wrap is synchronous
// but the measured flip lags a frame, so equal thresholds would flash.
const HEADER_RESERVED_INLINE_SIZE = 440;

/**
 * Premium Analytics post/page detail page stage component.
 *
 * A fixed, non-customizable page (WOOA7S-1622): there is no edit mode, so
 * required widgets and their sizing cannot be removed or reshaped.
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
				// `per_page: -1` returns every widget type; core-data's default query
				// (`per_page: 10`) could silently drop ones this fixed layout requires.
				.getEntityRecords( 'root', 'widgetModule', { per_page: -1 } ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules );

	// The host titles a card by its widget *type*; fixed compositions reuse
	// registered types under page-local aliases to carry the design title.
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

	// The resource, date range, and comparison all live in the URL search params.
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dateControls = useDetailDateControls( summary.publishedDate, dateFilters );

	// The header row hosts the panel in a shrink-to-fit slot, so the panel measures
	// the row itself to pick its responsive layout; see the `containerElement` prop.
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
							<LinkButton
								variant="solid"
								tone="neutral"
								size="compact"
								href={ publicUrl }
								openInNewTab
							>
								{ summary.type === 'page'
									? __( 'View page', 'jetpack-premium-analytics-pkg' )
									: __( 'View post', 'jetpack-premium-analytics-pkg' ) }
							</LinkButton>
						) : undefined
					}
					className={ styles.page }
				>
					<PostDetailTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab }>
						<div className={ styles.scrollArea }>
							{ /*
							 * The summary card and the date filter presets are shared by every
							 * tab (same post, same date range), so they render once above the
							 * per-tab widget grid and scroll away with it.
							 */ }
							<div ref={ setHeaderElement } className={ styles.header }>
								<div className={ styles.summary }>
									<PostSummaryCard
										summary={ summary }
										variant={ EMAIL_TAB_IDS.includes( activeTab ) ? 'email' : 'post' }
										performanceRange={ dateFilters.appliedRange }
									/>
								</div>
								<div className={ styles.dateFilters }>
									{ /*
									 * The design has no comparison on this page. The panel reads
									 * that from the scope the stage declares; the params themselves
									 * stay in the URL so the breadcrumb carries them back out.
									 */ }
									<DateFiltersPanel
										{ ...dateFilters }
										{ ...dateControls }
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
 * Route stage wrapper. Mounts its own AnalyticsQueryClientProvider above
 * PostDetail because widgets fetch through their own client inside
 * WidgetRoot, while the header summary fetches at the page level.
 *
 * @return {JSX.Element} The post detail page.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			{ /*
			 * The page names no compared period, so nothing below may fetch or draw
			 * one. The params stay on the URL for the breadcrumb to carry back out.
			 */ }
			<ReportScopeProvider offersComparison={ false }>
				<PostDetail />
			</ReportScopeProvider>
		</AnalyticsQueryClientProvider>
	);
}
