/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { ClicksLeaderboard, type ClickRow } from '../render';
import ClicksRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const CLICKS_RENDER_MODULE = 'storybook/clicks';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
};

interface ClicksStoryControls {
	withComparison: boolean;
}

interface ClicksDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		ClicksStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

const mockRows: ClickRow[] = [
	{
		label: 'wordpress.org',
		value: 3840,
		previousValue: 3100,
		href: 'https://wordpress.org/',
		icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
	},
	{
		label: 'developer.wordpress.org/reference',
		value: 2610,
		previousValue: 2940,
		href: 'https://developer.wordpress.org/reference/',
		icon: 'https://www.google.com/s2/favicons?domain=developer.wordpress.org&sz=32',
	},
	{
		label: 'jetpack.com/support',
		value: 1920,
		previousValue: 1270,
		href: 'https://jetpack.com/support/',
		icon: 'https://www.google.com/s2/favicons?domain=jetpack.com&sz=32',
	},
	{
		label: 'woocommerce.com',
		value: 1305,
		previousValue: 980,
		href: 'https://woocommerce.com/',
		icon: 'https://www.google.com/s2/favicons?domain=woocommerce.com&sz=32',
	},
	{
		label: 'example.com/downloads/whitepaper.pdf',
		value: 870,
		previousValue: 0,
		href: 'https://example.com/downloads/whitepaper.pdf',
	},
];

function renderClicksWidget( { withComparison }: ClicksStoryControls ) {
	return (
		<ClicksRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function ClicksDashboardStory( { withComparison, ...dashboardArgs }: ClicksDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ CLICKS_RENDER_MODULE }
			renderComponent={ ClicksRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Clicks',
	component: ClicksRender,
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
					'The "Clicks" widget. Shows the most-clicked external links as a ranked leaderboard, using the global dashboard date range. Each row links to the destination URL when available.',
			},
		},
	},
} satisfies Meta< ClicksStoryControls >;

export default meta;

type Story = StoryObj< ClicksStoryControls >;
type PresentationalStory = StoryObj< typeof ClicksLeaderboard >;
type DashboardStory = StoryObj< ClicksDashboardStoryProps >;

export const Default: Story = {
	render: renderClicksWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderClicksWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const LoadingState: PresentationalStory = {
	render: () => <ClicksLeaderboard isLoading={ true } />,
	decorators: [ withWidgetCanvas ],
};

export const ErrorState: PresentationalStory = {
	render: () => <ClicksLeaderboard isError={ true } />,
	decorators: [ withWidgetCanvas ],
};

export const EmptyState: PresentationalStory = {
	render: () => <ClicksLeaderboard rows={ [] } />,
	decorators: [ withChartTheme, withWidgetCanvas ],
};

export const WithMockRows: PresentationalStory = {
	render: () => <ClicksLeaderboard rows={ mockRows } withComparison={ true } />,
	decorators: [ withChartTheme, withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <ClicksDashboardStory { ...args } />,
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
