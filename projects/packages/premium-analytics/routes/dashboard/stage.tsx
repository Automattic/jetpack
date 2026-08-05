import { GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import {
	DateFiltersPanel,
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
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { resolveWidgetModuleWithI18n, useWidgetTypesWithI18n } from '../widget-module-i18n';
import { DashboardSections } from './components';
import { DATE_FILTER_YEAR } from './config';
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

	/*
	 * Date-range state lives in the URL search params. The shared controller
	 * stages edits locally and commits atomically on Apply (or immediately for
	 * comparison changes), so widgets re-fetch only on commit.
	 */
	const dateFilters = useReportDateFilters( '/' );

	/*
	 * Which date filter the active section's header shows. Also reconciles the
	 * preset in the URL with that filter's surface, so a section switch never
	 * leaves the visible control unable to represent the selection.
	 */
	const dateFilterSurface = useSectionDateFilter(
		sections.find( section => section.slug === activeSection ),
		dateFilters
	);

	/*
	 * The subtitle states what the widgets are currently showing, so it follows
	 * the applied range and comparison rather than the picker's staged draft:
	 * it must not move while an edit is open, only once Apply commits it.
	 *
	 * The year surface offers no comparison control, so its subtitle must not
	 * announce one it cannot be switched off from.
	 */
	const comparisonPresetId =
		dateFilterSurface === DATE_FILTER_YEAR ? undefined : dateFilters.appliedComparisonPresetId;
	const sectionSubtitle = useMemo(
		() =>
			getSectionSubtitle( {
				range: dateFilters.appliedRange,
				presetId: dateFilters.appliedPresetId,
				comparisonPresetId,
			} ),
		[ dateFilters.appliedRange, dateFilters.appliedPresetId, comparisonPresetId ]
	);

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
	 * and one set of controls is enough.
	 */
	const dateControls =
		dateFilterSurface === DATE_FILTER_YEAR ? (
			/*
			 * `startYear` is left out on purpose: nothing in this package knows how
			 * far back the site's data goes yet (`getStoreInfo()` is still a stub),
			 * so the surface falls back to `DEFAULT_YEAR_SURFACE_COUNT` — six years,
			 * which is the window the design shows. Pass the site's oldest year of
			 * content here once a source for it exists, so a younger site stops
			 * offering years it has nothing to show for.
			 */
			<DateYearFilter
				value={ dateFilters.appliedPresetId }
				onSelect={ selectYear }
				timeZone={ dateFilters.timeZone }
				containerElement={ containerElement }
			/>
		) : (
			<DateFiltersPanel { ...dateFilters } />
		);

	return (
		<GlobalErrorProvider>
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
					subTitle={ __(
						'Track your site performance and visitor insights.',
						'jetpack-premium-analytics-pkg'
					) }
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
								<div ref={ setContainerElement } className={ styles.sectionHeader }>
									<SectionHeader title={ section.label } subtitle={ sectionSubtitle }>
										{ dateControls }
									</SectionHeader>
								</div>

								{ activeSection === section.slug ? (
									<>
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
		</GlobalErrorProvider>
	);
}

export const stage = Dashboard;
