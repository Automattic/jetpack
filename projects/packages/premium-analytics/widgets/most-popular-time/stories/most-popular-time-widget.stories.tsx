/**
 * All three stories render the data-connected widget through `WidgetRoot`, so
 * they need report data to resolve against. `registerReportMocks` covers the
 * shared paths, including the `stats/insights` fixture wired into
 * `routeStatsReport()`. The insights endpoint has no comparison period, so
 * `WithComparison` renders identically to `Default` even though comparison
 * report params are supplied.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import MostPopularTimeRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MOST_POPULAR_TIME_RENDER_MODULE = 'storybook/most-popular-time';

/**
 * Story controls. `withComparison` toggles the comparison report params to
 * confirm the widget renders identically — the insights endpoint has no
 * comparison period.
 */
interface MostPopularTimeStoryControls {
	withComparison: boolean;
}

/**
 * Renders the data-connected widget with the given comparison state.
 *
 * @param {MostPopularTimeStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderMostPopularTime( { withComparison }: MostPopularTimeStoryControls ) {
	return (
		<MostPopularTimeRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the highlights fill the frame outside the grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MostPopularTime',
	component: MostPopularTimeRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Most popular time" widget. Shows the day of week and hour of day that draw the most views, each with its share of the total. The insights endpoint reports across the whole lifetime of the site, so there is no date range or comparison period.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MostPopularTimeRender > & MostPopularTimeStoryControls >;

export default meta;

type Story = StoryObj< MostPopularTimeStoryControls >;

/**
 * Default state — the peak day and hour highlights.
 */
export const Default: Story = {
	render: renderMostPopularTime,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison state — comparison report params are supplied, but the insights
 * endpoint has no comparison data, so this renders identically to Default.
 */
export const WithComparison: Story = {
	render: renderMostPopularTime,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The insights endpoint has no comparison period, so this renders identically to Default even when comparison report params are supplied.',
			},
		},
	},
};

interface MostPopularTimeDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		MostPopularTimeStoryControls {}

/**
 * Renders the data-connected widget through the shared dashboard harness, so it
 * appears exactly as it does in product (framed card, sizing, edit mode).
 *
 * @param {MostPopularTimeDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real `WidgetDashboard`.
 */
function MostPopularTimeDashboardStory( {
	withComparison,
	...dashboardArgs
}: MostPopularTimeDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ {
				name: widgetDefinition.name,
				title: widgetDefinition.title,
				icon: widgetDefinition.icon,
				presentation: 'framed',
			} }
			renderModule={ MOST_POPULAR_TIME_RENDER_MODULE }
			renderComponent={ MostPopularTimeRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< MostPopularTimeDashboardStoryProps > = {
	render: args => <MostPopularTimeDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
