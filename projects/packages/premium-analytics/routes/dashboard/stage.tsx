import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
import { getDashboardSections, type DashboardSectionId } from './config/sections';
import {
	DASHBOARD_NAME,
	useActiveSection,
	useDashboardGridSettings,
	useDashboardSectionLayout,
} from './hooks';
import styles from './stage.module.scss';

/**
 * Premium Analytics dashboard page stage component.
 *
 * @return {JSX.Element} The Premium Analytics dashboard.
 */
function Dashboard(): JSX.Element {
	const sections = useMemo( () => getDashboardSections(), [] );
	const [ activeSection, setActiveSection ] = useActiveSection();
	const [ layout, setLayout, resetLayout ] = useDashboardSectionLayout(
		DASHBOARD_NAME,
		activeSection
	);
	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();

	const widgetModules = useSelect(
		select =>
			(
				select( coreStore ) as unknown as {
					getEntityRecords: ( kind: string, name: string ) => WidgetModuleRecord[] | null;
				}
			 ).getEntityRecords( 'root', 'widgetModule' ),
		[]
	);

	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypes( widgetModules );

	const [ editMode, setEditMode ] = useState( false );

	const handleSectionChange = useCallback(
		( sectionId: string ) => setActiveSection( sectionId as DashboardSectionId ),
		[ setActiveSection ]
	);

	return (
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			isResolvingWidgetTypes={ isResolvingWidgetTypes }
			layout={ layout }
			onLayoutChange={ setLayout }
			onLayoutReset={ resetLayout }
			gridSettings={ gridSettings }
			onGridSettingsChange={ setGridSettings }
			editMode={ editMode }
			onEditChange={ setEditMode }
		>
			<Page
				title={ __( 'Analytics', 'jetpack-premium-analytics' ) }
				subTitle={ __(
					'Track your site performance and visitor insights.',
					'jetpack-premium-analytics'
				) }
				actions={ <WidgetDashboard.Actions /> }
				className={ styles.dashboard }
			>
				<Tabs.Root value={ activeSection } onValueChange={ handleSectionChange }>
					<div className={ styles.tabList }>
						<Tabs.List variant="minimal">
							{ sections.map( section => (
								<Tabs.Tab key={ section.id } value={ section.id }>
									{ section.label }
								</Tabs.Tab>
							) ) }
						</Tabs.List>
					</div>
					{ sections.map( section => (
						<Tabs.Panel
							key={ section.id }
							value={ section.id }
							focusable={ false }
							className={ styles.content }
						>
							{ activeSection === section.id ? (
								<>
									<WidgetDashboard.NoWidgetsState />
									<WidgetDashboard.Widgets />
								</>
							) : null }
						</Tabs.Panel>
					) ) }
				</Tabs.Root>

				<WidgetDashboard.Commands />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
