import { createElement } from 'react';
import { Select } from 'storybook/internal/components';
import {
	addons,
	types,
	useGlobals,
	useStorybookApi,
	useStorybookState,
} from 'storybook/manager-api';
import theme from './theme.mjs';

addons.setConfig( {
	theme,
} );

const WIDGET_SIZES_ID = 'jetpack/premium-analytics-widget-sizes';

const WIDGET_SIZES_OPTIONS = [
	{ value: 'single', title: 'Widget: single size' },
	{ value: 'matrix', title: 'Widget: size matrix' },
	{ value: 'resizable', title: 'Widget: resizable' },
];

/**
 * Whether a story is a close-up of a Premium Analytics widget, the kind the canvas
 * reading the `widgetSizes` global frames. A story tagged `widget-dashboard` is
 * not: it mounts the real dashboard.
 *
 * @param {object} story - Entry of the story on screen.
 * @return {boolean} Whether the story follows the control.
 */
function isWidgetCloseUp( story ) {
	return (
		story?.type === 'story' &&
		story.importPath?.includes( '/premium-analytics/widgets/' ) &&
		! story.tags?.includes( 'widget-dashboard' )
	);
}

/**
 * Toolbar control for the size, or sizes, a widget story is rendered at.
 *
 * @return {object|null} The control, or nothing on a story that does not follow it.
 */
function WidgetSizesTool() {
	const api = useStorybookApi();
	const { storyId } = useStorybookState();
	const [ globals, updateGlobals ] = useGlobals();

	if ( ! isWidgetCloseUp( api.getData( storyId ) ) ) {
		return null;
	}

	return createElement(
		Select,
		{
			defaultOptions: [ globals.widgetSizes ?? 'single' ],
			options: WIDGET_SIZES_OPTIONS,
			ariaLabel: 'Widget sizes',
			tooltip: 'Widget sizes',
			onSelect: widgetSizes => updateGlobals( { widgetSizes } ),
			showSelectedOptionTitle: true,
		},
		'Widget sizes'
	);
}

// A tool rather than a `globalTypes` toolbar, which shows on every story and page.
addons.register( WIDGET_SIZES_ID, () => {
	addons.add( WIDGET_SIZES_ID, {
		title: 'Widget sizes',
		type: types.TOOL,
		match: ( { viewMode, tabId } ) => viewMode === 'story' && ! tabId,
		render: WidgetSizesTool,
	} );
} );
