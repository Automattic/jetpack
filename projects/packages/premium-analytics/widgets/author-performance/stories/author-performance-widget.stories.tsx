/**
 * Served by the shared report mocks' period-bucketed `stats/top-authors` fixture;
 * the story scopes the widget to one of its authors the way the author detail
 * page seeds `author_id` from its URL.
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { presetForStoryInterval } from '../../stories/preset-for-story-interval';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import AuthorPerformanceRender from '../render';
import widgetDefinition, { type AuthorPerformanceChartType } from '../widget';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// An author from the shared fixture; any other id charts a flat zero series.
const MOCK_AUTHOR_ID = 101;

const AUTHOR_PERFORMANCE_RENDER_MODULE = 'storybook/author-performance';

interface AuthorPerformanceStoryControls {
	hasAuthorScope: boolean;
	interval: StatsChartBucketPeriod;
	chartType: AuthorPerformanceChartType;
}

function getAuthorPerformanceAttributes( {
	hasAuthorScope,
	interval,
	chartType,
}: AuthorPerformanceStoryControls ): ComponentProps<
	typeof AuthorPerformanceRender
>[ 'attributes' ] {
	return {
		chartType,
		reportParams: {
			...getDefaultQueryParams( false, presetForStoryInterval( interval ) ),
			interval,
			...( hasAuthorScope ? { author_id: MOCK_AUTHOR_ID } : {} ),
		},
	};
}

function renderAuthorPerformance( controls: AuthorPerformanceStoryControls ) {
	return <AuthorPerformanceRender attributes={ getAuthorPerformanceAttributes( controls ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AuthorPerformance',
	component: AuthorPerformanceRender,
	tags: [ 'autodocs' ],
	argTypes: {
		hasAuthorScope: {
			control: 'boolean',
			description:
				'Include the `author_id` report param the author detail page seeds from its URL.',
		},
		interval: {
			control: 'radio',
			options: [ 'day', 'week', 'month' ],
			description:
				'The page chart interval the endpoint buckets by. Monthly moves the story range to 90 days, the shortest preset that allows it.',
		},
		chartType: {
			control: 'radio',
			options: [ 'line', 'bar' ],
			description: 'The "Chart type" toolbar attribute rendered by the widget host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Author performance" widget of the author detail page: the scoped author\'s views per chart interval from `stats/top-authors`, as a bar chart by default. Without an author scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof AuthorPerformanceRender > & AuthorPerformanceStoryControls
>;

export default meta;

type Story = StoryObj< AuthorPerformanceStoryControls >;

export const Default: Story = {
	render: renderAuthorPerformance,
	args: { hasAuthorScope: true, interval: 'day', chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

export const NoAuthorScope: Story = {
	render: renderAuthorPerformance,
	args: { hasAuthorScope: false, interval: 'day', chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

interface AuthorPerformanceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, AuthorPerformanceStoryControls {}

function AuthorPerformanceDashboardStory( {
	hasAuthorScope,
	interval,
	chartType,
	...dashboardArgs
}: AuthorPerformanceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ AUTHOR_PERFORMANCE_RENDER_MODULE }
			renderComponent={ AuthorPerformanceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getAuthorPerformanceAttributes( { hasAuthorScope, interval, chartType } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AuthorPerformanceDashboardStoryProps > = {
	render: args => <AuthorPerformanceDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 2,
		hasAuthorScope: true,
		interval: 'day',
		chartType: 'bar',
	},
	argTypes: { ...widgetDashboardWithWidgetArgTypes },
};
