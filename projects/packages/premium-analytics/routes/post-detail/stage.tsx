import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { LinkButton } from '@jetpack-premium-analytics/externals';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import {
	DateFiltersPanel,
	safeHttpUrl,
	StatsBreadcrumbs,
	StatsPageIcon,
} from '@jetpack-premium-analytics/ui';
import {
	DetailPageLayout,
	DetailPageShell,
	DetailPageTabPanel,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { DEFAULT_GRID, ROW_HEIGHT_PRESETS, WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { PostDetailTabs, postHeaderSlots } from './components';
import { EMAIL_TAB_IDS, POST_DETAIL_WIDGET_TYPE_ALIASES } from './config';
import { useEmailTabScope, usePostDetailTabs, usePostSummary } from './hooks';
import { route } from './package.json';

const ROUTE_FROM = route.path;

// Fixed composition (WOOA7S-1622): grid stays independent from the
// customizable main-dashboard preference so it can't be stretched.
const POST_DETAIL_GRID = { ...DEFAULT_GRID, rowHeight: ROW_HEIGHT_PRESETS.small };

// The layout is fixed, so the change callback never fires; the dashboard
// still requires one because it owns a staging copy internally.
const noopLayoutChange = () => {};

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

	const summary = usePostSummary( postId );

	const publicUrl = safeHttpUrl( summary.url );

	// The resource, date range, and comparison all live in the URL search params.
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dateControls = useDetailDateControls( summary.publishedDate, dateFilters );

	// The email tabs report over the first 30 days after the send rather than
	// the URL range (WOOA7S-1945): their widgets take these params in place of
	// the URL's.
	const emailScope = useEmailTabScope( postId, dateControls.allTimeStart, dateFilters.timeZone );

	// With the summary failed the publish day will never arrive, so the email
	// tabs mount their fixed layout and let each widget surface its own error.
	const emailScopeBlocked = ! emailScope && ! summary.isLoading && summary.isError;

	const { tabs, activeTab, setActiveTab, layout } = usePostDetailTabs(
		postId,
		emailScope?.reportParams,
		emailScopeBlocked
	);
	const isEmailTab = EMAIL_TAB_IDS.includes( activeTab );

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
						...( variant.getHelp ? { help: variant.getHelp() } : {} ),
						...( variant.icon ? { icon: variant.icon } : {} ),
				  } ) )
				: [];
		} );

		return aliases.length ? [ ...widgetTypes, ...aliases ] : widgetTypes;
	}, [ widgetTypes ] );

	const breadcrumbs = useDetailBreadcrumbs( summary.title );

	// The email tabs are pinned to the send window, so the filter would only
	// suggest a choice they do not offer; the range stays in the URL so the Post
	// traffic tab keeps its selection. The design has no comparison on this page
	// either — the panel reads that from the scope the stage declares.
	const dateFiltersPanel = isEmailTab ? null : (
		<DateFiltersPanel { ...dateFilters } { ...dateControls } />
	);

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
				<DetailPageShell
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
				>
					<PostDetailTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab }>
						{ /*
						 * The header is shared by every tab (same post, same range), so it
						 * renders once above the per-tab grids; the email tabs give it an
						 * email identity and report over the send window.
						 */ }
						<DetailPageLayout
							header={ postHeaderSlots( {
								summary,
								variant: isEmailTab ? 'email' : 'post',
								performanceRange: isEmailTab ? emailScope?.range : dateFilters.appliedRange,
							} ) }
							controls={ dateFiltersPanel }
						>
							{ tabs.map( tab => (
								<DetailPageTabPanel key={ tab.id } value={ tab.id }>
									{ activeTab === tab.id ? <WidgetDashboard.Widgets /> : null }
								</DetailPageTabPanel>
							) ) }
						</DetailPageLayout>
					</PostDetailTabs>
				</DetailPageShell>
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
