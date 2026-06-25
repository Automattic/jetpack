import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import BookingsOverTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const BOOKINGS_OVER_TIME_RENDER_MODULE = 'storybook/bookings-over-time';
const DEFAULT_PRESET: SelectablePresetId = 'last-30-days';

const WIDGET_STORY_CONTAINER_STYLE = {
	width: '381px',
	height: '600px',
	maxWidth: '100%',
	padding: '16px',
	boxSizing: 'border-box',
	containerType: 'inline-size',
	containerName: 'widget',
} as const;

interface BookingsOverTimeStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

interface BookingsOverTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		BookingsOverTimeStoryControls {}

/**
 * Builds widget attributes for a Storybook date preset and comparison setting.
 *
 * @param props                - Story controls.
 * @param props.withComparison - Whether report mocks include comparison data.
 * @param props.preset         - Date range preset used for report params.
 * @return Widget render attributes for the selected report params.
 */
function getStoryAttributes( props: BookingsOverTimeStoryControls ) {
	const { withComparison, preset } = props;

	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

/**
 * Renders the Bookings over time widget directly.
 *
 * @param props - Story controls.
 * @return Standalone Bookings over time widget.
 */
function BookingsOverTimeWidgetStory( props: BookingsOverTimeStoryControls ) {
	return (
		<div style={ WIDGET_STORY_CONTAINER_STYLE }>
			<BookingsOverTimeRender attributes={ getStoryAttributes( props ) } />
		</div>
	);
}

/**
 * Renders the Bookings over time widget inside the dashboard story host.
 *
 * @param props - Dashboard story controls.
 * @return Dashboard story with the Bookings over time widget.
 */
function BookingsOverTimeDashboardStory( props: BookingsOverTimeDashboardStoryProps ) {
	const { withComparison, preset, ...dashboardStoryArgs } = props;

	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardStoryArgs }
			widgetType={ widgetDefinition }
			renderModule={ BOOKINGS_OVER_TIME_RENDER_MODULE }
			renderComponent={ BookingsOverTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getStoryAttributes( { withComparison, preset } ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/BookingsOverTime',
	component: BookingsOverTimeWidgetStory,
	tags: [ 'autodocs' ],
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	argTypes: {
		preset: {
			control: 'select',
			options: SELECTABLE_PRESETS,
		},
		withComparison: {
			control: 'boolean',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays bookings over time with an optional comparison period and sparkline.',
			},
		},
	},
} satisfies Meta< typeof BookingsOverTimeWidgetStory >;

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: {
		withComparison: true,
	},
};

export const WidgetDashboardWithWidget: Story = {
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		preset: {
			control: 'select',
			options: SELECTABLE_PRESETS,
		},
		withComparison: {
			control: 'boolean',
		},
	},
	render: BookingsOverTimeDashboardStory,
};
