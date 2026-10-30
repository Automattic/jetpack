import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import {
	isPlanDateLimitedSection,
	PeriodChangeSignalProvider,
	queryClient,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { JetpackFooter, Stack } from '@jetpack-premium-analytics/externals';
import {
	DashboardWidgetHostProvider,
	usePeriodHost,
	useReportDateFilters,
} from '@jetpack-premium-analytics/routing';
import { useSyncStatus } from '@jetpack-premium-analytics/site-sync';
import {
	DateFiltersPanel,
	DateIntervalDropdown,
	DateYearFilter,
	OnboardingWelcomeModal,
	PeriodChangeStatus,
	SectionHeader,
	SectionTabPanel,
	StatsBreadcrumbs,
	StatsPageIcon,
} from '@jetpack-premium-analytics/ui';
import {
	canSendFeedback,
	DashboardSectionProvider,
	PageOptionsMenu,
	ResetLayoutAction,
	useHostLinkSearch,
	useTrackCustomize,
	useTrackedDateRangeApply,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useDateWindowNotice } from '../date-window-notice';
import { isPremiumAnalyticsInitialSyncFinished } from '../site-readiness';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { useWidgetModules } from '../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../widget-module-i18n';
import {
	DashboardNotices,
	DashboardSections,
	FeedbackBanner,
	OnboardingTour,
	onboardingTourSteps,
	LockedSection,
	RefreshFailureNotice,
	SectionNotice,
	SectionSyncNotice,
	StatsSettingsPanel,
} from './components';
import {
	buildWidgetTypeRenames,
	DATE_FILTER_YEAR,
	getInsertableWidgetTypeNames,
	hasStoreSection,
	isSectionAwaitingSync,
	offersDateComparison,
	resolveSectionHeading,
	resolveSectionId,
	SETTINGS_SECTION,
	type DashboardSection,
} from './config';
import {
	useActiveSection,
	useDashboardGridSettings,
	useDashboardPolicy,
	useDashboardSectionLayout,
	useDashboardSections,
	useLockedSectionLayout,
	useOnboarding,
	useRememberAppliedPreset,
	useSectionDateFilter,
} from './hooks';
import './overlay-focus-ring.scss';
import { dateWindowForSectionSwitch } from './section-date-window';
import styles from './stage.module.scss';
import type { OnboardingTourStep } from './components/onboarding-tour';
import type { OnboardingFlow } from './hooks/use-onboarding';
import type { DateRange, YearSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import type { DashboardWidget } from '@wordpress/widget-dashboard';
import type { JSX } from 'react';

const SETTINGS_TAB_SLUGS = [ SETTINGS_SECTION ];
const NO_TAB_SLUGS: string[] = [];

/**
 * The section whose layout and date state a tab shows.
 *
 * @param id       - The tab.
 * @param sections - The available sections, in order.
 * @return The section slug.
 */
function widgetSectionOf( id: string, sections: DashboardSection[] ): string {
	// The Settings tab has no layout of its own, and `WidgetDashboard` opens Customize over an
	// empty one, so the first section's layout and date state stay in place behind it.
	return id === SETTINGS_SECTION ? resolveSectionId( undefined, sections ) : id;
}

/**
 * Premium Analytics dashboard page stage component.
 *
 * @return {JSX.Element} The Premium Analytics dashboard.
 */
function Dashboard(): JSX.Element {
	const { sections, hasResolved: hasResolvedSections } = useDashboardSections();
	const [ editMode, setEditMode ] = useState( false );
	// Present only for users who can manage the settings, on sites where the dashboard owns them.
	const hasSettingsTab = !! getScriptData()?.premium_analytics?.stats_settings;
	const switchSearch = useCallback(
		( id: string, search: Record< string, unknown > ) =>
			dateWindowForSectionSwitch(
				id,
				sections.find( section => section.slug === widgetSectionOf( id, sections ) ),
				search
			),
		[ sections ]
	);
	// Disabled while customizing, since a layout is arranged on a widget section.
	const [ activeSection, setActiveSection, isSectionCommitted ] = useActiveSection(
		sections,
		hasSettingsTab && ! editMode ? SETTINGS_TAB_SLUGS : NO_TAB_SLUGS,
		switchSearch
	);
	const isSettingsActive = activeSection === SETTINGS_SECTION;
	const widgetSection = widgetSectionOf( activeSection, sections );
	const widgetModules = useWidgetModules();
	const widgetTypeRenames = useMemo(
		() => buildWidgetTypeRenames( widgetModules ),
		[ widgetModules ]
	);
	const [ layout, setLayout, resetLayout ] = useDashboardSectionLayout(
		widgetSection,
		sections,
		widgetTypeRenames
	);
	const [ gridSettings ] = useDashboardGridSettings();

	const activeSectionRecord = sections.find( section => section.slug === widgetSection );

	// The inserter offers the active section's default layout types plus those it declares insertable.
	const insertableWidgetTypes = useMemo(
		() => getInsertableWidgetTypeNames( activeSectionRecord ? [ activeSectionRecord ] : [] ),
		[ activeSectionRecord ]
	);

	/*
	 * The watcher runs at the dashboard level, not inside the notice below, so the
	 * sync starts as soon as the dashboard opens rather than when the section is visited.
	 */
	const isSyncFinished = isPremiumAnalyticsInitialSyncFinished();
	const sectionsAwaitSync = sections.some( section =>
		isSectionAwaitingSync( section, isSyncFinished )
	);
	// The sync routes take manage_options; anyone else would only collect 403s.
	const canRunSync = currentUserCan( 'manage_options' );
	const {
		data: syncStatus,
		error: syncError,
		isComplete: isSyncComplete,
		triggerSync,
	} = useSyncStatus( { enabled: sectionsAwaitSync && canRunSync, autoStart: true } );

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

	const resolveWidgetModule = useWidgetModuleResolver( widgetModules );

	const trackCustomize = useTrackCustomize( 'dashboard', widgetSection );
	// Every way into and out of edit mode arrives here: the menu below, the command
	// palette, an empty layout, and the dashboard's own Cancel and Done.
	const onEditChange = useCallback(
		( nextEditMode: boolean ) => {
			if ( nextEditMode ) {
				trackCustomize.start();
			} else {
				trackCustomize.exit();
			}
			setEditMode( nextEditMode );
		},
		[ trackCustomize ]
	);
	const startCustomizing = useCallback( () => onEditChange( true ), [ onEditChange ] );
	const onLayoutChange = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			trackCustomize.layoutChange( layout, nextLayout );
			setLayout( nextLayout );
		},
		[ layout, setLayout, trackCustomize ]
	);
	const { lockedSection, visibleLayout, onVisibleLayoutChange, isHiddenWidget } =
		useLockedSectionLayout( widgetSection, layout, onLayoutChange );
	const isSectionLocked = !! lockedSection;
	const dashboardPolicy = useDashboardPolicy( {
		insertableWidgetTypes,
		lockedLayout: isSectionLocked ? visibleLayout : undefined,
	} );
	const canCustomizeSection = dashboardPolicy( { operation: 'customize' } );
	// Edit mode survives a tab switch, so leave it on arriving at a section that cannot be arranged.
	// The exit is recorded against the section arrived at, as Done after any tab switch is.
	useEffect( () => {
		if ( editMode && ! canCustomizeSection ) {
			onEditChange( false );
		}
	}, [ editMode, canCustomizeSection, onEditChange ] );
	// Settings has no layout to customize.
	const canPerform = useMemo< typeof dashboardPolicy >(
		() =>
			isSettingsActive
				? request => request.operation !== 'customize' && dashboardPolicy( request )
				: dashboardPolicy,
		[ dashboardPolicy, isSettingsActive ]
	);
	const resetToDefault = useCallback( () => {
		trackCustomize.reset();
		// A locked section resets only what it shows, so an upgrade brings back the rest as arranged.
		resetLayout( isHiddenWidget );
		setEditMode( false );
	}, [ isHiddenWidget, resetLayout, trackCustomize ] );

	// Only the widgets this section renders need metadata at boot; the full registry
	// waits for edit mode. `null` until sections resolve, since the layout is empty until then.
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames: hasResolvedSections ? visibleLayout.map( widget => widget.type ) : null,
		includeAll: editMode,
	} );

	const { dateLimits, offersComparison: planOffersComparison } = useStatsDateLimits(
		isPlanDateLimitedSection( widgetSection )
	);
	useDateWindowNotice();
	const lockedIntervals = dateLimits?.lockedIntervals;

	/*
	 * Date-range state lives in the URL search params; the controller stages edits
	 * locally and commits on Apply, so widgets re-fetch only on commit.
	 */
	const dateFilters = useReportDateFilters( '/', { lockedIntervals, dateLimits } );

	/*
	 * Also reconciles the preset in the URL with the resolved surface, so a section
	 * switch never leaves the visible control unable to represent the selection.
	 */
	const dateFilterSurface = useSectionDateFilter(
		activeSectionRecord,
		dateFilters,
		isSectionCommitted
	);

	// Server-driven, like the surface above, and only where the plan has room for one.
	const offersComparison =
		offersDateComparison( dateFilterSurface, activeSectionRecord?.date_filter_options ) &&
		planOffersComparison;

	// The tour's anchors, handed in by the elements below once they mount.
	const [ optionsMenuFrame, setOptionsMenuFrame ] = useState< HTMLDivElement | null >( null );
	const [ controlsAnchor, setControlsAnchor ] = useState< HTMLDivElement | null >( null );
	const [ widgetsFrame, setWidgetsFrame ] = useState< HTMLDivElement | null >( null );
	const [ tabListFrame, setTabListFrame ] = useState< HTMLDivElement | null >( null );
	const tourAnchors = {
		// Every tile is a section; the grid draws them in layout order.
		firstWidget: widgetsFrame?.querySelector( 'section' ) ?? null,
		dateControls: controlsAnchor,
		optionsMenu: optionsMenuFrame?.querySelector( 'button' ) ?? null,
		sectionTabs: tabListFrame?.querySelector( '[role="tablist"]' ) ?? null,
	};
	// A step without its anchor is left out, so the counter counts what is on the page.
	const tourStepsFor = ( flow: OnboardingFlow ) =>
		onboardingTourSteps( tourAnchors, {
			withFeedback: canSendFeedback(),
			flow,
			withCustomize: canCustomizeSection,
			withComparison: offersComparison,
		} ).filter( step => step.anchor );
	// Built every render rather than memoized: the anchors are looked up fresh, since the
	// first widget mounts after its frame.
	const tourStepsByFlow: Record< OnboardingFlow, OnboardingTourStep[] > = {
		stats: tourStepsFor( 'stats' ),
		store: tourStepsFor( 'store' ),
		'stats-and-store': tourStepsFor( 'stats-and-store' ),
	};

	const defaultSection = resolveSectionId( undefined, sections );

	// The journey introduces the default section at rest: not another tab, and
	// not while the reader is already customizing.
	const onboarding = useOnboarding( {
		enabled: hasResolvedSections && ! editMode && activeSection === defaultSection,
		hasStoreSection: hasStoreSection( sections ),
		stepCounts: {
			stats: tourStepsByFlow.stats.length,
			store: tourStepsByFlow.store.length,
			'stats-and-store': tourStepsByFlow[ 'stats-and-store' ].length,
		},
	} );
	const tourSteps = tourStepsByFlow[ onboarding.flow ];

	// Placement only: the date state is the same either way.
	const showHeaderDateControl =
		activeSectionRecord?.date_filter_options?.with_header_date_control ?? true;
	const showHeaderIntervalControl =
		activeSectionRecord?.date_filter_options?.with_header_interval_control ?? true;

	// A widget can set the period, here or on another section (WOOA7S-2036); once
	// the section shows the period control, it draws attention to the new period.
	const showsPeriodControl =
		showHeaderDateControl &&
		! editMode &&
		! isSettingsActive &&
		dateFilterSurface !== DATE_FILTER_YEAR;
	const { openPeriod, attentionId } = usePeriodHost(
		widgetSection,
		dateFilters.appliedRange,
		showsPeriodControl,
		lockedIntervals
	);

	const {
		onChange: changeDateRange,
		onComparisonChange: changeComparison,
		onApply: applyDateRange,
		onStep: stepDateRange,
	} = dateFilters;
	const { trackedOnChange, trackedOnApply } = useTrackedDateRangeApply(
		{
			presetId: dateFilters.presetId,
			range: dateFilters.range,
			interval: dateFilters.interval,
			comparisonPresetId: dateFilters.comparisonPresetId,
			appliedComparisonRange: dateFilters.appliedComparisonRange,
		},
		{
			surface: 'dashboard',
			section: widgetSection,
			offersComparison,
			lockedIntervals,
		}
	);
	const {
		onChange: rememberOnChange,
		onComparisonChange: rememberOnComparisonChange,
		onApply: rememberOnApply,
	} = useRememberAppliedPreset();
	const onDateChange = useCallback< typeof changeDateRange >(
		( ...args ) => {
			changeDateRange( ...args );
			trackedOnChange( ...args );
			rememberOnChange( ...args );
		},
		[ changeDateRange, trackedOnChange, rememberOnChange ]
	);
	const onDateApply = useCallback( () => {
		applyDateRange();
		trackedOnApply();
		rememberOnApply();
	}, [ applyDateRange, trackedOnApply, rememberOnApply ] );
	const onComparisonChange = useCallback< typeof changeComparison >(
		( range, presetId ) => {
			changeComparison( range, presetId );
			rememberOnComparisonChange( range, presetId );
		},
		[ changeComparison, rememberOnComparisonChange ]
	);
	// A step applies at once: tracked like a range the reader picked, and
	// remembered only when it lands back on a preset.
	const onDateStep = useCallback< typeof stepDateRange >(
		direction => {
			const stepped = stepDateRange( direction );

			if ( stepped ) {
				trackedOnChange( stepped.range, stepped.presetId, {
					exactRange: true,
					interval: stepped.interval,
				} );
				trackedOnApply();
				rememberOnChange( stepped.range, stepped.presetId );
				rememberOnApply();
			}

			return stepped;
		},
		[ stepDateRange, trackedOnChange, trackedOnApply, rememberOnChange, rememberOnApply ]
	);

	/*
	 * The year surface applies on click — no Apply step of its own — so stage and
	 * commit together, the way `DatePeriodDropdown` applies a period.
	 */
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
	// Ignore the unmount. Tab panels overlap for a frame, so the outgoing
	// header would otherwise overwrite the incoming one with null (WOOA7S-2066).
	const setHeaderRef = useCallback( ( el: HTMLDivElement | null ) => {
		if ( el ) {
			setHeaderElement( el );
		}
	}, [] );

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
	 * Gone while customizing: reading controls take no part in arranging a layout,
	 * and Done or Cancel bring them back over the applied range.
	 */
	let dateControls: JSX.Element | null = null;

	if ( showHeaderDateControl && ! editMode ) {
		dateControls =
			dateFilterSurface === DATE_FILTER_YEAR ? (
				/*
				 * The interval control is composed here rather than inside
				 * `DateYearFilter`, which stays the preset surface alone.
				 */
				<Stack direction="row" align="center" gap="sm">
					{ /*
					 * `startYear` is omitted: nothing here knows how far back data goes, so the
					 * surface falls back to `DEFAULT_YEAR_SURFACE_COUNT`.
					 */ }
					<DateYearFilter
						value={ dateFilters.appliedPresetId }
						onSelect={ selectYear }
						timeZone={ dateFilters.timeZone }
						containerElement={ headerElement }
					/>

					{ showHeaderIntervalControl && (
						<DateIntervalDropdown
							options={ dateFilters.intervalOptions }
							lockedOptions={ dateFilters.lockedIntervalOptions }
							lockUpsell={ dateLimits?.intervalUpsell }
							value={ dateFilters.interval }
							onChange={ dateFilters.onIntervalChange }
						/>
					) }
				</Stack>
			) : (
				/*
				 * Report pages mount this same panel over records tables, which have no
				 * interval, so the control is asked for rather than implied.
				 */
				<DateFiltersPanel
					{ ...dateFilters }
					onChange={ onDateChange }
					onComparisonChange={ onComparisonChange }
					onApply={ onDateApply }
					onStep={ onDateStep }
					withIntervalControl={ showHeaderIntervalControl }
					attentionId={ attentionId }
				/>
			);
	}

	return (
		<>
			<PeriodChangeStatus
				attentionId={ attentionId }
				appliedPresetId={ dateFilters.appliedPresetId }
				appliedRange={ dateFilters.appliedRange }
			/>
			{ /*
			 * Declared once for widgets below: hiding the control doesn't strip the params,
			 * so a widget reading them off the URL could show a comparison the reader can't see.
			 */ }
			<ReportScopeProvider
				offersComparison={ offersComparison }
				openPeriod={ openPeriod }
				dateLimits={ dateLimits }
			>
				{ /* Outside the dashboard: the inserter mounts beyond `children`. */ }
				<DashboardWidgetHostProvider useLinkSearch={ useHostLinkSearch }>
					<WidgetDashboard.Policy canPerform={ canPerform }>
						<WidgetDashboard
							widgetTypes={ widgetTypes }
							isResolvingWidgetTypes={ isResolvingWidgetTypes }
							resolveWidgetModule={ resolveWidgetModule }
							layout={ visibleLayout }
							onLayoutChange={ onVisibleLayoutChange }
							onLayoutReset={ resetLayout }
							gridSettings={ gridSettings }
							editMode={ editMode }
							onEditChange={ onEditChange }
						>
							<Page
								visual={ <StatsPageIcon /> }
								breadcrumbs={ <StatsBreadcrumbs isRoot /> }
								actions={
									<Stack direction="row" gap="sm">
										{ /* At rest these would add a second Customize beside the menu's. */ }
										{ editMode && (
											<>
												<WidgetDashboard.Actions />
												<ResetLayoutAction onReset={ resetToDefault } />
											</>
										) }
										<Stack ref={ setOptionsMenuFrame } direction="row">
											<PageOptionsMenu
												onCustomize={
													editMode || isSettingsActive || ! canCustomizeSection
														? undefined
														: startCustomizing
												}
											/>
										</Stack>
									</Stack>
								}
								className={ styles.dashboard }
							>
								<DashboardSections
									sections={ sections }
									withSettingsTab={ hasSettingsTab }
									isSettingsTabDisabled={ editMode }
									value={ activeSection }
									onChange={ setActiveSection }
									tabListRef={ setTabListFrame }
								>
									{ sections.map( section => (
										<SectionTabPanel
											key={ section.slug }
											value={ section.slug }
											className={ styles.content }
										>
											<SectionHeader
												ref={ setHeaderRef }
												title={ resolveSectionHeading( section ) }
												pinned
												controlsRef={ setControlsAnchor }
											>
												{ dateControls }
											</SectionHeader>

											{ /* Widgets query the committed URL, which keeps the last tab's window until a switch lands. */ }
											{ activeSection === section.slug && isSectionCommitted ? (
												<DashboardSectionProvider section={ section.slug }>
													<div className={ styles.body }>
														<RefreshFailureNotice />
														{ ! editMode && <DashboardNotices /> }

														{ /* Behind the onboarding journey: it introduces the tabs
														     the banner asks about. */ }
														<FeedbackBanner
															enabled={
																canSendFeedback() &&
																! editMode &&
																section.slug === defaultSection &&
																onboarding.phase === 'closed'
															}
														/>

														{ isSectionAwaitingSync( section, isSyncFinished ) &&
														! isSyncComplete ? (
															<SectionSyncNotice
																canRunSync={ canRunSync }
																percentage={ syncStatus?.percentage ?? 0 }
																hasError={ !! syncError }
																onRetry={ retrySync }
																isRetrying={ isRetryingSync }
															/>
														) : (
															section.notice && <SectionNotice message={ section.notice } />
														) }

														{ ! isSectionLocked && <WidgetDashboard.NoWidgetsState /> }
														<div ref={ setWidgetsFrame }>
															<WidgetDashboard.Widgets className={ styles.widgets } />
														</div>
														{ isSectionLocked && <LockedSection section={ section.slug } /> }
													</div>
												</DashboardSectionProvider>
											) : null }
										</SectionTabPanel>
									) ) }

									{ hasSettingsTab && (
										<SectionTabPanel value={ SETTINGS_SECTION } className={ styles.content }>
											<DashboardSectionProvider section={ SETTINGS_SECTION }>
												<div className={ styles.body }>
													<StatsSettingsPanel />
												</div>
											</DashboardSectionProvider>
										</SectionTabPanel>
									) }

									<JetpackFooter />
								</DashboardSections>

								<WidgetDashboard.Commands />

								<OnboardingWelcomeModal
									open={ onboarding.phase === 'modal' }
									variant={ onboarding.flow }
									onStart={ onboarding.start }
									onDismiss={ onboarding.dismiss }
								/>
								{ onboarding.phase === 'tour' && (
									<OnboardingTour
										steps={ tourSteps }
										current={ onboarding.step }
										onNext={ onboarding.next }
										onDismiss={ onboarding.dismiss }
									/>
								) }
							</Page>
						</WidgetDashboard>
					</WidgetDashboard.Policy>
				</DashboardWidgetHostProvider>
			</ReportScopeProvider>
		</>
	);
}

/**
 * Route stage wrapper: the signal provider sits above the dashboard so a widget
 * and the header, which both read it, share one.
 *
 * @return The dashboard page.
 */
export function stage(): JSX.Element {
	return (
		<PeriodChangeSignalProvider>
			<Dashboard />
		</PeriodChangeSignalProvider>
	);
}
