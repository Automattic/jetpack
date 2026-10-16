import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import {
	PeriodChangeSignalProvider,
	queryClient,
	ReportScopeProvider,
} from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import { usePeriodHost, useReportDateFilters } from '@jetpack-premium-analytics/routing';
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
	useTrackCustomize,
	useTrackedDateRangeApply,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useDateWindowNotice } from '../date-window-notice';
import { isPremiumAnalyticsInitialSyncFinished } from '../site-readiness';
import { isPlanDateLimitedSection } from '../stats-date-window';
import { useStatsDateLimits } from '../use-stats-date-limits';
import { useWidgetModules } from '../use-widget-modules';
import { useWidgetModuleResolver, useWidgetTypesWithI18n } from '../widget-module-i18n';
import {
	DashboardSections,
	FeedbackBanner,
	OnboardingTour,
	onboardingTourSteps,
	hasPurchaseSuccess,
	PlanLimitNotice,
	PurchaseSuccessNotice,
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
	const [ activeSection, setActiveSection, committedSection ] = useActiveSection(
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

	/**
	 * The widget types the inserter offers, for now, are:
	 * - those that are already in the layout
	 * - those that are the active section's default layout
	 */
	const insertableWidgetTypes = useMemo(
		() => getInsertableWidgetTypeNames( activeSectionRecord ? [ activeSectionRecord ] : [] ),
		[ activeSectionRecord ]
	);
	const dashboardPolicy = useDashboardPolicy( { insertableWidgetTypes } );
	// Settings has no layout to customize, and `WidgetDashboard` opens Customize over an empty one.
	const canPerform = useMemo< typeof dashboardPolicy >(
		() =>
			isSettingsActive
				? request => request.operation !== 'customize' && dashboardPolicy( request )
				: dashboardPolicy,
		[ dashboardPolicy, isSettingsActive ]
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
	const resetToDefault = useCallback( () => {
		trackCustomize.reset();
		resetLayout();
		setEditMode( false );
	}, [ resetLayout, trackCustomize ] );

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
		onboardingTourSteps( tourAnchors, { withFeedback: canSendFeedback(), flow } ).filter(
			step => step.anchor
		);
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

	// Only the widgets this section renders need metadata at boot; the full registry
	// waits for edit mode. `null` until sections resolve, since the layout is empty until then.
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypesWithI18n( widgetModules, {
		visibleNames: hasResolvedSections ? layout.map( widget => widget.type ) : null,
		includeAll: editMode,
	} );

	const { dateLimits, offersComparison: planOffersComparison } = useStatsDateLimits(
		isPlanDateLimitedSection( widgetSection )
	);
	useDateWindowNotice();

	/*
	 * Date-range state lives in the URL search params; the controller stages edits
	 * locally and commits on Apply, so widgets re-fetch only on commit.
	 */
	const dateFilters = useReportDateFilters( '/', {
		lockedIntervals: dateLimits?.lockedIntervals,
	} );

	/*
	 * Also reconciles the preset in the URL with the resolved surface, so a section
	 * switch never leaves the visible control unable to represent the selection.
	 */
	const dateFilterSurface = useSectionDateFilter(
		activeSectionRecord,
		dateFilters,
		activeSection === committedSection
	);

	// Server-driven, like the surface above, and only where the plan has room for one.
	const offersComparison =
		offersDateComparison( dateFilterSurface, activeSectionRecord?.date_filter_options ) &&
		planOffersComparison;

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
		showsPeriodControl
	);

	const {
		onChange: changeDateRange,
		onComparisonChange: changeComparison,
		onApply: applyDateRange,
	} = dateFilters;
	const { trackedOnChange, trackedOnApply } = useTrackedDateRangeApply(
		{
			presetId: dateFilters.presetId,
			range: dateFilters.range,
			interval: dateFilters.interval,
			comparisonPresetId: dateFilters.comparisonPresetId,
			appliedComparisonRange: dateFilters.appliedComparisonRange,
		},
		{ surface: 'dashboard', section: widgetSection, offersComparison }
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
				<WidgetDashboard.Policy canPerform={ canPerform }>
					<WidgetDashboard
						widgetTypes={ widgetTypes }
						isResolvingWidgetTypes={ isResolvingWidgetTypes }
						resolveWidgetModule={ resolveWidgetModule }
						layout={ layout }
						onLayoutChange={ onLayoutChange }
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
											onCustomize={ editMode || isSettingsActive ? undefined : startCustomizing }
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
											notice={ <RefreshFailureNotice /> }
											controlsRef={ setControlsAnchor }
										>
											{ dateControls }
										</SectionHeader>

										{ /* Widgets query the committed URL, which keeps the last tab's window until a switch lands. */ }
										{ activeSection === section.slug && committedSection === section.slug ? (
											<div className={ styles.body }>
												{ /* A checkout return holds the plan limit notice back for the
												     whole load, even once dismissed. */ }
												{ ! editMode &&
													( hasPurchaseSuccess() ? (
														<PurchaseSuccessNotice />
													) : (
														<PlanLimitNotice />
													) ) }

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

												{ isSectionAwaitingSync( section, isSyncFinished ) && ! isSyncComplete ? (
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

												<WidgetDashboard.NoWidgetsState />
												<div ref={ setWidgetsFrame }>
													<DashboardSectionProvider section={ section.slug }>
														<WidgetDashboard.Widgets className={ styles.widgets } />
													</DashboardSectionProvider>
												</div>
											</div>
										) : null }
									</SectionTabPanel>
								) ) }

								{ hasSettingsTab && (
									<SectionTabPanel value={ SETTINGS_SECTION } className={ styles.content }>
										<div className={ styles.body }>
											<StatsSettingsPanel />
										</div>
									</SectionTabPanel>
								) }
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
