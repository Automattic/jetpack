/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscribersListRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

const SUBSCRIBERS_LIST_RENDER_MODULE = 'storybook/subscribers-list';

// Close-up canvas so the roster fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SubscribersList',
	component: SubscribersListRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget listing the most recent subscribers (avatar + name + relative "since" time) with an "N more" footer. Data comes from the designated `useStatsFollowers` hook; in Storybook it is served by `registerReportMocks`.',
			},
		},
	},
} satisfies Meta< typeof SubscribersListRender >;

export default meta;

type Story = StoryObj< Record< string, never > >;
type DashboardStory = StoryObj< WidgetDashboardWithWidgetControls >;

/**
 * The widget on its own, populated from mocked followers data.
 */
export const Default: Story = {
	render: () => <SubscribersListRender attributes={ { num: 6 } } />,
	decorators: [ withWidgetCanvas ],
};

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => (
		<WidgetDashboardWithWidgetStory
			{ ...args }
			widgetType={ widgetDefinition }
			renderModule={ SUBSCRIBERS_LIST_RENDER_MODULE }
			renderComponent={ SubscribersListRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { num: 6 } }
		/>
	),
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
