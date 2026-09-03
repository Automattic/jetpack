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
} from '@jetpack-premium-analytics/ui';
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { isPremiumAnalyticsInitialSyncFinished } from '../site-readiness';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import {
	DashboardSections,
	FeedbackAction,
	RefreshFailureNotice,
	SectionSyncNotice,
} from './components';
import {
	DATE_FILTER_YEAR,
	isSectionAwaitingSync,
	offersDateComparison,
	resolveSectionHeading,
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
	 * The watcher runs at the dashboard level, not inside the notice below, so the
	 * sync starts as soon as the dashboard opens rather than when the section is visited.
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
					) => WidgetModuleRecord[] | null;
				}
			 )
				// `per_page: -1` returns every widget type; core-data's default query
				// (`per_page: 10`) would silently hide any widget past the tenth.
				.getEntityRecords( 'root', 'widgetModule', { per_page: -1 } ),
		[]
	);

	const [ editMode, setEditMode ] = useState( false );

	// Only the widgets this section renders need metadata at boot; the full registry
	// waits for edit mode. `null` until sections resolve, since the layout is empty until then.
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames: hasResolvedSections ? layout.map( widget => widget.type ) : null,
		includeAll: editMode,
	} );

	/*
	 * Date-range state lives in the URL search params; the controller stages edits
	 * locally and commits on Apply, so widgets re-fetch only on commit.
	 */
	const dateFilters = useReportDateFilters( '/' );

	const activeSectionRecord = sections.find( section => section.slug === activeSection );

	/*
	 * Also reconciles the preset in the URL with the resolved surface, so a section
	 * switch never leaves the visible control unable to represent the selection.
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
	 * The year surface applies on click — no Apply step of its own — so stage and
	 * commit together, the way `DatePeriodDropdown` applies a period.
	 */
	const { onChange: onDateChange, onApply: onDateApply } = dateFilters;
	const selectYear = useCallback(
		( range: DateRange, presetId: YearSurfacePresetId ) => {
			onDateChange( range, presetId );
			onDateApply();
		},
		[ onDateChange, onDateApply ]
	);

	// The year surface still measures: its pills collapse into a select where the
	// header row runs short, and the row is what it has to measure, not the body.
	const [ headerElement, setHeaderElement ] = useState< HTMLDivElement | null >( null );

	// WidgetDashboard treats a transiently-empty layout as "no widgets" and
	// force-opens edit mode, so it must not mount before the sections resolve.
	if ( ! hasResolvedSections ) {
		return (
			<Stack justify="center" align="center" className={ styles.loading }>
				<Spinner />
			</Stack>
		);
	}

	/*
	 * Tab panels unmount when unfocused, so only the active section's header renders
	 * and one set of controls suffices; an opted-out section renders none at all.
	 */
	let dateControls: JSX.Element | null = null;

	if ( showHeaderDateControl ) {
		dateControls =
			dateFilterSurface === DATE_FILTER_YEAR ? (
				/*
				 * The interval control is composed here rather than inside
				 * `DateYearFilter`, which stays the preset surface alone.
				 */
				<Stack direction="row" align="center" gap="sm">
					{ /*
					 * `startYear` is omitted: `getStoreInfo()` is still a stub, so nothing here
					 * knows how far back data goes; the surface falls back to `DEFAULT_YEAR_SURFACE_COUNT`.
					 */ }
					<DateYearFilter
						value={ dateFilters.appliedPresetId }
						onSelect={ selectYear }
						timeZone={ dateFilters.timeZone }
						containerElement={ headerElement }
					/>

					<DateIntervalDropdown
						options={ dateFilters.intervalOptions }
						value={ dateFilters.interval }
						onChange={ dateFilters.onIntervalChange }
					/>
				</Stack>
			) : (
				/*
				 * Report pages mount this same panel over records tables, which have no
				 * interval, so the control is asked for rather than implied.
				 */
				<DateFiltersPanel { ...dateFilters } withIntervalControl />
			);
	}

	return (
		<GlobalErrorProvider>
			{ /*
			 * Declared once for widgets below: hiding the control doesn't strip the params,
			 * so a widget reading them off the URL could show a comparison the reader can't see.
			 */ }
			<ReportScopeProvider offersComparison={ showComparison }>
				<WidgetDashboard
					widgetTypes={ widgetTypes }
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
						actions={
							<>
								<FeedbackAction />
								<WidgetDashboard.Actions />
							</>
						}
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
									{ /* Marks where the header below comes to rest, so it starts
								     condensing there. Measured, never seen. */ }
									<div className={ styles.pinMarker } aria-hidden="true" />

									<div ref={ setHeaderElement } className={ styles.sectionHeader }>
										<SectionHeader title={ resolveSectionHeading( section ) } condenseOnScroll>
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
