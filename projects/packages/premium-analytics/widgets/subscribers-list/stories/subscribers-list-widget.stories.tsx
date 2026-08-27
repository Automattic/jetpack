/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SubscribersListRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

// The roster builds each subscriber's details URL from `window.JetpackScriptData`,
// which only wp-admin provides; seed the site slug so the names link in Storybook.
window.JetpackScriptData = {
	...window.JetpackScriptData,
	site: {
		...window.JetpackScriptData?.site,
		suffix: 'example.com',
	},
} as typeof window.JetpackScriptData;

const SUBSCRIBERS_LIST_RENDER_MODULE = 'storybook/subscribers-list';

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
	render: () => <SubscribersListRender attributes={ {} } />,
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => <SubscribersListRender attributes={ {} } />,
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/followers', 'loading' );
		return () => setReportMockState( 'stats/followers', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => <SubscribersListRender attributes={ {} } />,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/followers', 'error' );
		return () => setReportMockState( 'stats/followers', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral customer
 * glyph and "No subscribers yet.").
 */
export const Empty: Story = {
	render: () => <SubscribersListRender attributes={ {} } />,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/followers', 'empty' );
		return () => setReportMockState( 'stats/followers', null );
	},
};

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => (
		<WidgetDashboardWithWidgetStory
			{ ...args }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ SUBSCRIBERS_LIST_RENDER_MODULE }
			renderComponent={ SubscribersListRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ {} }
		/>
	),
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
