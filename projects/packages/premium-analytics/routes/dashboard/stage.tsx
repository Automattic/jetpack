import { GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel, SectionTabPanel } from '@jetpack-premium-analytics/ui';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { DashboardSections } from './components';
import {
	useActiveSection,
	useDashboardGridSettings,
	useDashboardSectionLayout,
	useDashboardSections,
} from './hooks';
import styles from './stage.module.scss';

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

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypes( widgetModules );

	const [ editMode, setEditMode ] = useState( false );

	/*
	 * Date-range state lives in the URL search params. The shared controller
	 * stages edits locally and commits atomically on Apply (or immediately for
	 * comparison changes), so widgets re-fetch only on commit.
	 */
	const dateFilters = useReportDateFilters( '/' );

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

	return (
		<GlobalErrorProvider>
			<WidgetDashboard
				widgetTypes={ widgetTypes }
				isResolvingWidgetTypes={ isResolvingWidgetTypes }
				layout={ layout }
				onLayoutChange={ setLayout }
				onLayoutReset={ resetLayout }
				gridSettings={ gridSettings }
				editMode={ editMode }
				onEditChange={ setEditMode }
			>
				<Page
					breadcrumbs={
						<Breadcrumbs
							items={ [ { label: __( 'Analytics', 'jetpack-premium-analytics-pkg' ) } ] }
						/>
					}
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
						{ /*
						 * The date filters drive every section, so they render once
						 * below the section tabs and above the widgets, sharing the
						 * URL search state across all sections.
						 *
						 * The wrapper div is also the responsive-measurement target:
						 * DateFiltersPanel reads its width to pick mobile/wide layouts
						 * instead of relying on the viewport.
						 */ }
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
						</div>
						{ sections.map( section => (
							<SectionTabPanel
								key={ section.slug }
								value={ section.slug }
								className={ styles.content }
							>
								{ activeSection === section.slug ? (
									<>
										<WidgetDashboard.NoWidgetsState />
										<WidgetDashboard.Widgets />
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
