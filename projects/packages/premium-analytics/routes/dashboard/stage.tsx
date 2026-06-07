/**
 * External dependencies
 */
import {
	WidgetDashboard,
	useDashboardLayout,
	useDashboardGridSettings,
} from '@automattic/jetpack-widget-dashboard';
import { useWidgetTypes } from '@automattic/jetpack-widget-primitives';
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Premium Analytics dashboard route.
 */
function Dashboard() {
	const [ layout, setLayout ] = useDashboardLayout( 'jetpack-premium-analytics_dashboard' );
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
