import {
	GlobalErrorProvider,
	queryClient,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { useSyncStatus } from '@jetpack-premium-analytics/site-sync';
import {
	DateFiltersPanel,
	DateIntervalDropdown,
	DateYearFilter,
	SectionHeader,
	SectionTabPanel,
	StatsBreadcrumbs,
	StatsPageIcon,
	getSectionSubtitle,
} from '@jetpack-premium-analytics/ui';
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { isPremiumAnalyticsInitialSyncFinished } from '../site-readiness';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { DashboardSections, RefreshFailureNotice, SectionSyncNotice } from './components';
import {
	DATE_FILTER_YEAR,
	isSectionAwaitingSync,
	offersDateComparison,
	resolveSectionHeading,
	selectSectionWidgetTypes,
	type SectionScopedWidgetModuleRecord,
} from './config';
import {
	useActiveSection,
	useDashboardGridSettings,
	useDashboardSectionLayout,
	useDashboardSections,
	useSectionDateFilter,
} from './hooks';
import styles from './stage.module.scss';
import type { DateRange, YearSurfacePresetId } from '@jetpack-premium-analytics/datetime';

/**
 * Premium Analytics dashboard page stage component.
 *
 * @return {JSX.Element} The Premium Analytics dashboard.
 */
function Dashboard(): JSX.Element {
	const { sections, hasResolved: hasResolvedSections } = useDashboardSections();
	const [ activeSection, setActiveSection ] = useActiveSection( sections );
	const [ layout, setLayout, resetLayout ] = useDashboardSectionLayout( activeSection, sections );
	const [ gridSettings ] = useDashboardGridSettings();

	/*
	 * Only a section whose data reaches WordPress.com through the analytics full
	 * sync has incomplete numbers; the rest read data it already holds. The
	 * watcher runs at the dashboard level rather than inside the notice below, so
	 * the sync starts as soon as the dashboard opens instead of only once that
	 * section is visited.
	 */
	const isSyncFinished = isPremiumAnalyticsInitialSyncFinished();
	const sectionsAwaitSync = sections.some( section =>
		isSectionAwaitingSync( section, isSyncFinished )
	);
	const {
		data: syncStatus,
		error: syncError,
		isComplete: isSyncComplete,
		triggerSync,
	} = useSyncStatus( { enabled: sectionsAwaitSync, autoStart: true } );

	const [ isRetryingSync, setIsRetryingSync ] = useState( false );
	const retrySync = useCallback( async () => {
		setIsRetryingSync( true );
		try {
			await triggerSync();
		} finally {
			setIsRetryingSync( false );
		}
	}, [ triggerSync ] );

	// Widgets that rendered mid-sync cached numbers the sync has since filled in.
	useEffect( () => {
		if ( isSyncComplete ) {
			queryClient.invalidateQueries( { queryKey: [ 'reports' ] } );
		}
	}, [ isSyncComplete ] );

	const widgetModules = useSelect(
		select =>
			(
				select( coreStore ) as unknown as {
					getEntityRecords: (
						kind: string,
						name: string,
						query?: Record< string, unknown >
					) => SectionScopedWidgetModuleRecord[] | null;
				}
			 )
				// `per_page: -1` returns every widget type. Without it, core-data's default
				// query (`per_page: 10`) caps the mapped records at 10, silently hiding any
				// widget past the tenth from the "Add widget" gallery.
				.getEntityRecords( 'root', 'widgetModule', { per_page: -1 } ),
		[]
	);

	const [ editMode, setEditMode ] = useState( false );

	// Only the widgets this section renders need their metadata resolved at
	// boot; the complete registry is what the widget picker lists, so it can
	// wait for edit mode. `null` until the sections resolve — the layout is
	// empty until then, and this hook runs on those renders too, below the
	// spinner returned further down. See `useWidgetTypesWithI18n`.
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames: hasResolvedSections ? layout.map( widget => widget.type ) : null,
		includeAll: editMode,
	} );

	// Keyed on the names themselves rather than the array, the way
	// `useWidgetTypesWithI18n` keys its own scope: a drag or a resize rewrites
	// `layout` without changing which types it places, and rebuilding the scoped
	// list on each of those would hand `WidgetDashboard` a new array for nothing.
	const placedTypesKey = layout
		.map( widget => widget.type )
		.sort()
		.join( '\n' );
	const placedTypes = useMemo(
		() => new Set( placedTypesKey ? placedTypesKey.split( '\n' ) : [] ),
		[ placedTypesKey ]
	);

	// A widget type can be scoped to some sections only — the gallery in one
	// section must not offer a widget whose numbers that section cannot date.
	const sectionWidgetTypes = useMemo(
		() => selectSectionWidgetTypes( widgetTypes, widgetModules, activeSection, placedTypes ),
		[ widgetTypes, widgetModules, activeSection, placedTypes ]
	);

	/*
	 * Date-range state lives in the URL search params. The shared controller
	 * stages edits locally and commits atomically on Apply (or immediately for
	 * comparison changes), so widgets re-fetch only on commit.
	 */
	const dateFilters = useReportDateFilters( '/' );

	const activeSectionRecord = sections.find( section => section.slug === activeSection );

	/*
	 * Which date filter the active section's header shows. Also reconciles the
	 * preset in the URL with that filter's surface, so a section switch never
	 * leaves the visible control unable to represent the selection.
	 */
	const dateFilterSurface = useSectionDateFilter( activeSectionRecord, dateFilters );

	// Server-driven, like the surface above.
	const showComparison = offersDateComparison(
		dateFilterSurface,
		activeSectionRecord?.date_filter_options
	);

	// Placement only: the date state is the same either way.
	const showHeaderDateControl =
		activeSectionRecord?.date_filter_options?.with_header_date_control ?? true;

	/*
	 * The subtitle states what the widgets are currently showing, so it follows
	 * the applied range and comparison rather than the picker's staged draft:
	 * it must not move while an edit is open, only once Apply commits it.
	 *
	 * A header without the comparison control must not announce one, and a
	 * header that does not own the date control must not announce the range.
	 */
	const comparisonPresetId = showComparison ? dateFilters.appliedComparisonPresetId : undefined;
	const comparisonRange = showComparison ? dateFilters.appliedComparisonRange : undefined;
	const sectionSubtitle = useMemo( () => {
		if ( ! showHeaderDateControl ) {
			return undefined;
		}

		return getSectionSubtitle( {
			range: dateFilters.appliedRange,
			presetId: dateFilters.appliedPresetId,
			comparisonPresetId,
			comparisonRange,
			// The interval control renders as a glyph, so the subtitle is where
			// the active bucket is readable. Both surfaces that render a header
			// control carry it.
			interval: dateFilters.appliedInterval,
		} );
	}, [
		showHeaderDateControl,
		dateFilters.appliedRange,
		dateFilters.appliedPresetId,
		dateFilters.appliedInterval,
		comparisonPresetId,
		comparisonRange,
	] );

	/*
	 * The year surface applies on click — it has no Apply step of its own — so
	 * stage and commit together, the way the quick presets do inside
	 * `DateRangeFilter`.
	 */
	const { onChange: onDateChange, onApply: onDateApply } = dateFilters;
	const selectYear = useCallback(
		( range: DateRange, presetId: YearSurfacePresetId ) => {
			onDateChange( range, presetId );
			onDateApply();
		},
		[ onDateChange, onDateApply ]
	);

	// Container element for the date filters panel responsive layout.
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	// The sections carry each section's default layout, so until the entity
	// resolves the layout above is transiently empty. WidgetDashboard treats an
	// empty layout as "no widgets" and force-opens edit mode, so it must not
	// mount before the sections exist.
	if ( ! hasResolvedSections ) {
		return (
			<Stack justify="center" align="center" className={ styles.loading }>
				<Spinner />
			</Stack>
		);
	}

	/*
	 * The date controls belong to the active section: the tab panels unmount
	 * when they lose focus, so only the active section's header is ever rendered
	 * and one set of controls is enough. A section that opts out of the header
	 * control renders none at all — its widgets host their own.
	 */
	let dateControls: JSX.Element | null = null;

	if ( showHeaderDateControl ) {
		dateControls =
			dateFilterSurface === DATE_FILTER_YEAR ? (
				/*
				 * The year surface carries the interval control but no comparison.
				 * Composed here rather than inside `DateYearFilter`, which stays the
				 * preset surface alone.
				 */
				<Stack direction="row" align="center" gap="sm">
					{ /*
					 * `startYear` is left out on purpose: nothing in this package knows how
					 * far back the site's data goes yet (`getStoreInfo()` is still a stub),
					 * so the surface falls back to `DEFAULT_YEAR_SURFACE_COUNT` — six years,
					 * which is the window the design shows. Pass the site's oldest year of
					 * content here once a source for it exists, so a younger site stops
					 * offering years it has nothing to show for.
					 */ }
					<DateYearFilter
						value={ dateFilters.appliedPresetId }
						onSelect={ selectYear }
						timeZone={ dateFilters.timeZone }
						containerElement={ containerElement }
					/>

					<DateIntervalDropdown
						options={ dateFilters.intervalOptions }
						value={ dateFilters.interval }
						onChange={ dateFilters.onIntervalChange }
					/>
				</Stack>
			) : (
				/*
				 * The dashboard's widgets are charts bucketed by the interval. The
				 * report pages mount this same panel over records tables, which are
				 * not, so the control is asked for rather than implied by the props.
				 */
				<DateFiltersPanel { ...dateFilters } withIntervalControl />
			);
	}

	return (
		<GlobalErrorProvider>
			{ /*
			 * The same answer the header uses to decide whether to render the
			 * comparison control, declared once for the widgets below: hiding
			 * the control does not strip the params, and a widget reading them
			 * straight off the URL would show a comparison this section's
			 * reader has no way to see or switch off.
			 */ }
			<ReportScopeProvider offersComparison={ showComparison }>
				<WidgetDashboard
					widgetTypes={ sectionWidgetTypes }
					isResolvingWidgetTypes={ isResolvingWidgetTypes }
					resolveWidgetModule={ resolveWidgetModuleWithI18n }
					layout={ layout }
					onLayoutChange={ setLayout }
					onLayoutReset={ resetLayout }
					gridSettings={ gridSettings }
					editMode={ editMode }
					onEditChange={ setEditMode }
				>
					<Page
						visual={ <StatsPageIcon /> }
						breadcrumbs={ <StatsBreadcrumbs isRoot /> }
						subTitle={ activeSectionRecord?.description }
						actions={ <WidgetDashboard.Actions /> }
						className={ styles.dashboard }
					>
						<DashboardSections
							sections={ sections }
							value={ activeSection }
							onChange={ setActiveSection }
						>
							{ sections.map( section => (
								<SectionTabPanel
									key={ section.slug }
									value={ section.slug }
									className={ styles.content }
								>
									{ /* Marks where the header below comes to rest, so its subtitle
								     starts condensing there. Measured, never seen. */ }
									<div className={ styles.pinMarker } aria-hidden="true" />

									<div ref={ setContainerElement } className={ styles.sectionHeader }>
										<SectionHeader
											title={ resolveSectionHeading( section ) }
											subtitle={ sectionSubtitle }
											condenseOnScroll
										>
											{ dateControls }
										</SectionHeader>
										{ /* Inside the pinned band, so its Retry stays reachable however
										     far the reader has scrolled. */ }
										<RefreshFailureNotice className={ styles.refreshFailure } />
									</div>

									{ activeSection === section.slug ? (
										<>
											{ isSectionAwaitingSync( section, isSyncFinished ) && ! isSyncComplete ? (
												<SectionSyncNotice
													percentage={ syncStatus?.percentage ?? 0 }
													hasError={ !! syncError }
													onRetry={ retrySync }
													isRetrying={ isRetryingSync }
												/>
											) : null }

											<WidgetDashboard.NoWidgetsState />
											<WidgetDashboard.Widgets className={ styles.widgets } />
										</>
									) : null }
								</SectionTabPanel>
							) ) }
						</DashboardSections>

						<WidgetDashboard.Commands />
					</Page>
				</WidgetDashboard>
			</ReportScopeProvider>
		</GlobalErrorProvider>
	);
}

export const stage = Dashboard;
