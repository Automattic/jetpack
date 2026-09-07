import {
	AnalyticsQueryClientProvider,
	GlobalErrorProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import {
	Badge,
	Icon,
	IconButton,
	LinkButton,
	Menu,
	Stack,
} from '@jetpack-premium-analytics/externals';
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
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical, pencil } from '@wordpress/icons';
import { useParams } from '@wordpress/route';
import { WidgetDashboard, type CanPerformDashboardOperation } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { DETAIL_GRID } from '../detail-grid';
import { useDetailBreadcrumbs } from '../use-detail-breadcrumbs';
import { useDetailDateControls } from '../use-detail-date-controls';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { PostDetailTabs, postHeaderSlots } from './components';
import { EMAIL_TAB_IDS, POST_DETAIL_WIDGET_TYPE_ALIASES } from './config';
import {
	useEmailTabScope,
	usePostDetailTabLayout,
	usePostDetailTabs,
	usePostSummary,
} from './hooks';
import { route } from './package.json';

const ROUTE_FROM = route.path;

/**
 * What the reader may do to a detail tab's composition: rearrange its cards,
 * never add or remove them (WOOA7S-1622). Customize is offered by the page
 * options menu, not the dashboard's own button, and Reset only joins Cancel
 * and Done while customizing (WOOA7S-2033).
 *
 * @param isCustomizing - Whether the page is in customize mode.
 * @return The policy for `WidgetDashboard.Policy`.
 */
function usePostDetailPolicy( isCustomizing: boolean ): CanPerformDashboardOperation {
	return useCallback< CanPerformDashboardOperation >(
		request => {
			switch ( request.operation ) {
				case 'customize':
				case 'insert':
				case 'remove':
					return false;
				case 'reset':
					return isCustomizing;
				default:
					return true;
			}
		},
		[ isCustomizing ]
	);
}

/**
 * Premium Analytics post/page detail page stage component.
 *
 * The composition is fixed (WOOA7S-1622), but the reader can rearrange its
 * cards per tab from the page options menu (STATS-428); the arrangement is
 * committed by the dashboard's own Done action and stored in preferences.
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

	const {
		tabs,
		activeTab,
		setActiveTab,
		layout: fixedLayout,
	} = usePostDetailTabs( postId, emailScope?.reportParams, emailScopeBlocked );

	// The stored per-tab arrangement, layered over the fixed composition.
	const { layout, setLayout, resetLayout } = usePostDetailTabLayout( activeTab, fixedLayout );

	const [ isCustomizing, setIsCustomizing ] = useState( false );
	const canPerform = usePostDetailPolicy( isCustomizing );

	const startCustomizing = useCallback( () => setIsCustomizing( true ), [] );

	const onEditChange = useCallback(
		( nextEditMode: boolean ) => {
			// An empty layout makes the dashboard request edit mode on its own (its
			// empty state invites customization); a detail tab is only empty while
			// the email gate resolves, so that request is ignored here.
			if ( nextEditMode && layout.length === 0 ) {
				return;
			}
			setIsCustomizing( nextEditMode );
		},
		[ layout ]
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

	// While customizing, the dashboard's own Cancel and Done (and Reset, in their
	// overflow) take the actions slot; the page options menu is the way in.
	const actions = isCustomizing ? (
		<WidgetDashboard.Actions />
	) : (
		<Stack direction="row" align="center" gap="sm">
			{ publicUrl ? (
				<LinkButton variant="solid" tone="neutral" size="compact" href={ publicUrl } openInNewTab>
					{ summary.type === 'page'
						? __( 'View page', 'jetpack-premium-analytics-pkg' )
						: __( 'View post', 'jetpack-premium-analytics-pkg' ) }
				</LinkButton>
			) : null }
			<Menu.Root>
				<Menu.Trigger
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Page options', 'jetpack-premium-analytics-pkg' ) }
							variant="minimal"
							tone="brand"
							size="compact"
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<Menu.Item prefix={ <Icon icon={ pencil } /> } onClick={ startCustomizing }>
						<Menu.ItemLabel>{ __( 'Customize', 'jetpack-premium-analytics-pkg' ) }</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);

	return (
		<GlobalErrorProvider>
			<WidgetDashboard.Policy canPerform={ canPerform }>
				<WidgetDashboard
					widgetTypes={ pageWidgetTypes }
					isResolvingWidgetTypes={ isResolvingWidgetTypes }
					resolveWidgetModule={ resolveWidgetModuleWithI18n }
					layout={ layout }
					onLayoutChange={ setLayout }
					onLayoutReset={ resetLayout }
					gridSettings={ DETAIL_GRID }
					editMode={ isCustomizing }
					onEditChange={ onEditChange }
				>
					<DetailPageShell
						visual={ <StatsPageIcon /> }
						breadcrumbs={
							isCustomizing ? (
								<Stack direction="row" align="center" gap="sm">
									<StatsBreadcrumbs items={ breadcrumbs } />
									<Badge intent="informational">
										{ __( 'Customizing', 'jetpack-premium-analytics-pkg' ) }
									</Badge>
								</Stack>
							) : (
								<StatsBreadcrumbs items={ breadcrumbs } />
							)
						}
						actions={ actions }
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
			</WidgetDashboard.Policy>
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
