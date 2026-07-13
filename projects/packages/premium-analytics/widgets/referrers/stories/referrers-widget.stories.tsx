/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import ReferrersRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const REFERRERS_RENDER_MODULE = 'storybook/referrers';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface ReferrersStoryControls {
	withComparison: boolean;
}

interface ReferrersDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		ReferrersStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

function renderReferrersWidget( { withComparison }: ReferrersStoryControls ) {
	return (
		<ReferrersRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function ReferrersDashboardStory( {
	withComparison,
	...dashboardArgs
}: ReferrersDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ REFERRERS_RENDER_MODULE }
			renderComponent={ ReferrersRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Referrers',
	component: ReferrersRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Referrers" widget. Shows the websites and search engines referring visitors to the site as a ranked leaderboard, using the global dashboard date range. Referrer groups drill down into their sources and domains; URL-backed leaf rows (no children) render as outbound links that open in a new tab, while rows that drill down remain buttons.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ReferrersRender > & ReferrersStoryControls >;

export default meta;

type Story = StoryObj< ReferrersStoryControls >;
type DashboardStory = StoryObj< ReferrersDashboardStoryProps >;

export const Default: Story = {
	render: renderReferrersWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderReferrersWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <ReferrersDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
};
