import { GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { WidgetDashboard, type DashboardWidget } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { DashboardSections } from './components';
import {
	DASHBOARD_NAME,
	useActiveSection,
	useDashboardGridSettings,
	useDashboardSections,
} from './hooks';
import styles from './stage.module.scss';

/**
 * Premium Analytics dashboard page stage component.
 *
 * @return {JSX.Element} The Premium Analytics dashboard.
 */
function Dashboard(): JSX.Element {
	const { sections, isResolvingSections, updateSectionLayout, resetSectionLayout } =
		useDashboardSections( DASHBOARD_NAME );
	const [ activeSection, setActiveSection ] = useActiveSection( sections );
	const activeDashboardSection = useMemo(
		() => sections.find( section => section.id === activeSection ),
		[ activeSection, sections ]
	);
	const layout = activeDashboardSection?.layout ?? [];
	const [ gridSettings ] = useDashboardGridSettings();

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			if ( activeDashboardSection ) {
				void updateSectionLayout( activeDashboardSection.id, nextLayout );
			}
		},
		[ activeDashboardSection, updateSectionLayout ]
	);

	const resetLayout = useCallback( async () => {
		if ( activeDashboardSection ) {
			await resetSectionLayout( activeDashboardSection.id );
		}
	}, [ activeDashboardSection, resetSectionLayout ] );

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

	const pageProps = {
		title: __( 'Analytics', 'jetpack-premium-analytics' ),
		subTitle: __(
			'Track your site performance and visitor insights.',
			'jetpack-premium-analytics'
		),
		className: styles.dashboard,
	};

	if ( isResolvingSections || ! activeDashboardSection ) {
		return (
			<GlobalErrorProvider>
				<Page { ...pageProps }>{ null }</Page>
			</GlobalErrorProvider>
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
				<Page { ...pageProps } actions={ <WidgetDashboard.Actions /> }>
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
							<Tabs.Panel key={ section.id } value={ section.id } className={ styles.content }>
								{ activeSection === section.id ? (
									<>
										<WidgetDashboard.NoWidgetsState />
										<WidgetDashboard.Widgets />
									</>
								) : null }
							</Tabs.Panel>
						) ) }
					</DashboardSections>

					<WidgetDashboard.Commands />
				</Page>
			</WidgetDashboard>
		</GlobalErrorProvider>
	);
}

export const stage = Dashboard;
