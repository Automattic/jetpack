/**
 * External dependencies
 */
import {
	WidgetDashboard,
	useDashboardLayout,
	useDashboardGridSettings,
} from '@automattic/jetpack-widget-dashboard';
import type { ResolveWidgetModule, WidgetType } from '@automattic/jetpack-widget-primitives';
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import HelloWorld from './widgets/hello-world/render';

/**
 * Statically registered widget types. Replaces the dynamic
 * `useWidgetTypes()` REST discovery until the widget registry lands.
 */
const WIDGET_TYPES: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'jpa/hello-world',
		title: __( 'Hello World', 'jetpack-premium-analytics' ),
		icon: wordpress,
		presentation: 'full-bleed',
		renderModule: 'jpa/hello-world',
	},
];

/**
 * Resolves a widget's render module to its local component. Replaces the
 * default `import( url )` resolution while widgets are statically bundled.
 * @param moduleId
 */
const resolveWidgetModule: ResolveWidgetModule = moduleId =>
	moduleId === 'jpa/hello-world'
		? Promise.resolve( { default: HelloWorld } )
		: Promise.reject( new Error( `Unknown widget module: ${ moduleId }` ) );

/**
 * Premium Analytics dashboard route.
 */
function Dashboard() {
	const [ layout, setLayout ] = useDashboardLayout( 'jetpack-premium-analytics_dashboard' );
	const [ gridSettings, setGridSettings ] = useDashboardGridSettings();
	const [ editMode, setEditMode ] = useState( false );

	return (
		<WidgetDashboard
			widgetTypes={ WIDGET_TYPES }
			layout={ layout }
			onLayoutChange={ setLayout }
			gridSettings={ gridSettings }
			onGridSettingsChange={ setGridSettings }
			resolveWidgetModule={ resolveWidgetModule }
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
