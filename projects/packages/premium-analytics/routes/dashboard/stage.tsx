/**
 * External dependencies
 */
import { WidgetDashboard } from '@wordpress/widget-dashboard';
import { useWidgetTypes } from '@wordpress/widget-primitives';
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, useDashboardLayout, useDashboardGridSettings } from './hooks';

/**
 * Premium Analytics dashboard route.
 */
function Dashboard() {
	const [ layout, setLayout ] = useDashboardLayout( DASHBOARD_NAME );
	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();
	const [ widgetTypes, isResolvingWidgetTypes ] = useWidgetTypes();
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
		>
			<Page
				title={ __( 'Analytics', 'jetpack-premium-analytics' ) }
				actions={ <WidgetDashboard.Actions /> }
				hasPadding
			>
				<WidgetDashboard.NoWidgetsState />
				<WidgetDashboard.Widgets />
			</Page>
		</WidgetDashboard>
	);
}

export const stage = Dashboard;
