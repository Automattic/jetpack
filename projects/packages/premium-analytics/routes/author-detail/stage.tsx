/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	getApiErrorStatus,
	GlobalErrorProvider,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import {
	buildReportLink,
	pickReportDateParams,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel, StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	DetailPageActions,
	DetailPageBreadcrumbs,
	DetailPageLayout,
	DetailPageSection,
	DetailPageShell,
	describeError,
	useDetailPageCustomize,
	useStoredDetailLayout,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, useParams, useSearch } from '@wordpress/route';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */
import { DETAIL_GRID } from '../grid';
import { useDetailDateControls } from '../use-detail-date-controls';
import { useWidgetModules } from '../use-widget-modules';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { toWidgetTypeBaseNames, withWidgetTypeAliases } from '../widget-type-aliases';
import { authorHeaderSlots } from './components';
import { AUTHOR_DETAIL_LAYOUT, AUTHOR_DETAIL_WIDGET_TYPE_ALIASES } from './config';
import { useAuthorSummary } from './hooks';
import { route } from './package.json';

const ROUTE_FROM = route.path;

const PREFERENCES_SCOPE = 'jetpack-premium-analytics/author-detail';
const LAYOUT_ID = 'author';

/**
 * Premium Analytics author detail page shell: a fixed composition the reader can
 * rearrange from the page options menu, stored in preferences.
 *
 * @return The author detail page.
 */
function AuthorDetail(): JSX.Element {
	const { authorId: authorIdParam } = useParams( { from: ROUTE_FROM } ) as { authorId?: string };
	const summary = useAuthorSummary( Number( authorIdParam ) );

	const widgetModules = useWidgetModules();

	const { layout, setLayout, resetLayout } = useStoredDetailLayout(
		PREFERENCES_SCOPE,
		LAYOUT_ID,
		AUTHOR_DETAIL_LAYOUT
	);

	// A fixed composition with no picker only ever needs its own four types resolved.
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames: toWidgetTypeBaseNames(
			layout.map( widget => widget.type ),
			AUTHOR_DETAIL_WIDGET_TYPE_ALIASES
		),
	} );
	const pageWidgetTypes = useMemo(
		() => withWidgetTypeAliases( widgetTypes, AUTHOR_DETAIL_WIDGET_TYPE_ALIASES ),
		[ widgetTypes ]
	);

	// All time stays on the dashboard's default window, not the author's first post:
	// Stats credits page and product views to the author too, and those can predate
	// it. WOOA7S-2137 anchors it on the author's first published content instead.
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dateControls = useDetailDateControls( undefined, dateFilters );

	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const reportSearch = pickReportDateParams( search );

	const canRenderWidgets = ! summary.isLoading && ! summary.isError && ! summary.isNotFound;

	// Without cards there is nothing to arrange, and a refetch that fails
	// mid-customize would otherwise hide Cancel and Done along with the grid.
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
		surface: 'author_detail',
	} );

	// The trail is fixed to Stats / All authors / Author regardless of which report
	// the reader arrived from: the author list is this page's only parent.
	const breadcrumbs = useMemo(
		() => [
			{
				label: __( 'All authors', 'jetpack-premium-analytics-pkg' ),
				to: buildReportLink( 'authors', search ),
			},
			{ label: __( 'Author', 'jetpack-premium-analytics-pkg' ) },
		],
		[ search ]
	);

	let notice: JSX.Element | null = null;

	if ( summary.isError ) {
		// Same split as the widgets, plus a 404: sites that hide the users
		// endpoint answer with one, and no Retry brings it back.
		const { description, actions = [] } =
			getApiErrorStatus( summary.error ) === 404
				? {
						description: __(
							"This site doesn't share author profiles.",
							'jetpack-premium-analytics-pkg'
						),
					}
				: describeError( summary.error, {
						retryDescription: __(
							"We couldn't load this author. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: summary.refetch,
					} );

		notice = (
			<Stack direction="column" align="flex-start" gap="sm">
				<Text>{ description }</Text>
				{ actions.map( action => (
					<Button key={ action.label } variant="outline" onClick={ action.onClick }>
						{ action.label }
					</Button>
				) ) }
			</Stack>
		);
	} else if ( summary.isNotFound ) {
		notice = (
			<Stack direction="column" align="flex-start" gap="sm">
				<Text>{ __( "We couldn't find this author.", 'jetpack-premium-analytics-pkg' ) }</Text>
				<Link
					to="/reports/$report"
					params={ { report: 'authors' } as unknown as never }
					search={ reportSearch as unknown as never }
				>
					{ __( 'Back to Authors', 'jetpack-premium-analytics-pkg' ) }
				</Link>
			</Stack>
		);
	}

	return (
		<WidgetDashboard.Policy canPerform={ canPerform }>
			<WidgetDashboard
				widgetTypes={ pageWidgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				resolveWidgetModule={ resolveWidgetModuleWithI18n }
				layout={ layout }
				onLayoutChange={ onLayoutChange }
				onLayoutReset={ resetLayout }
				gridSettings={ DETAIL_GRID }
				editMode={ isCustomizing }
				onEditChange={ onEditChange }
			>
				<DetailPageShell
					visual={ <StatsPageIcon /> }
					breadcrumbs={
						<DetailPageBreadcrumbs isCustomizing={ isCustomizing }>
							<StatsBreadcrumbs items={ breadcrumbs } />
						</DetailPageBreadcrumbs>
					}
					actions={
						<DetailPageActions
							isCustomizing={ isCustomizing }
							onCustomize={ canCustomize ? startCustomizing : undefined }
							onReset={ resetToDefault }
							editingActions={ <WidgetDashboard.Actions /> }
						/>
					}
				>
					<DetailPageLayout
						header={ authorHeaderSlots( { summary } ) }
						// The presets render in every summary state, so the range stays
						// adjustable while the author loads or errors.
						controls={ <DateFiltersPanel { ...dateFilters } { ...dateControls } /> }
					>
						{ canRenderWidgets ? (
							<DetailPageSection>
								<WidgetDashboard.Widgets />
							</DetailPageSection>
						) : null }
						{ notice ? <DetailPageSection>{ notice }</DetailPageSection> : null }
					</DetailPageLayout>
				</DetailPageShell>
			</WidgetDashboard>
		</WidgetDashboard.Policy>
	);
}

/**
 * Route stage wrapper.
 *
 * @return The author detail page with its data and error providers.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<GlobalErrorProvider>
				{ /* No compared period on this page; the params stay on the URL for the breadcrumb. */ }
				<ReportScopeProvider offersComparison={ false }>
					<AuthorDetail />
				</ReportScopeProvider>
			</GlobalErrorProvider>
		</AnalyticsQueryClientProvider>
	);
}
