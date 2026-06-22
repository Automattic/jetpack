/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes, type WidgetModuleRecord } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, useDashboardLayout, useDashboardGridSettings } from './hooks';

/**
 * Premium Analytics dashboard page stage component.
 *
 * @return {JSX.Element} The Premium Analytics dashboard.
 */
function Dashboard() {
	const [ layout, setLayout, resetLayout ] = useDashboardLayout( DASHBOARD_NAME );
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

	return (
		<WidgetDashboard
			widgetTypes={ widgetTypes }
			isResolvingWidgetTypes={ isResolvingWidgetTypes }
			layout={ layout }
			onLayoutChange={ setLayout }
			gridSettings={ gridSettings }
			onGridSettingsChange={ setGridSettings }
			editMode={ editMode }
			onEditChange={ setEditMode }
			onLayoutReset={ resetLayout }
		>
			<Page
				title={ __( 'Analytics', 'jetpack-premium-analytics' ) }
				actions={ <WidgetDashboard.Actions /> }
				hasPadding
			>
				<WidgetDashboard.NoWidgetsState />
				<WidgetDashboard.Widgets />

				<WidgetDashboard.Commands />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
