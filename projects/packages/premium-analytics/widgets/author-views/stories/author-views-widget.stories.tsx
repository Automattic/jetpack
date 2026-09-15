/**
 * Served by the shared report mocks' day-bucketed `stats/top-authors` fixture;
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
import AuthorViewsRender from '../render';
import widgetDefinition, { type AuthorViewsChartType } from '../widget';
import type { StatsChartBucketPeriod } from '@jetpack-premium-analytics/data';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// An author from the shared fixture; any other id charts a flat zero series.
const MOCK_AUTHOR_ID = 101;

const AUTHOR_VIEWS_RENDER_MODULE = 'storybook/author-views';

interface AuthorViewsStoryControls {
	hasAuthorScope: boolean;
	interval: StatsChartBucketPeriod;
	chartType: AuthorViewsChartType;
}

function getAuthorViewsAttributes( {
	hasAuthorScope,
	interval,
	chartType,
}: AuthorViewsStoryControls ): ComponentProps< typeof AuthorViewsRender >[ 'attributes' ] {
	return {
		chartType,
		reportParams: {
			...getDefaultQueryParams( false, presetForStoryInterval( interval ) ),
			interval,
			...( hasAuthorScope ? { author_id: MOCK_AUTHOR_ID } : {} ),
		},
	};
}

function renderAuthorViews( controls: AuthorViewsStoryControls ) {
	return <AuthorViewsRender attributes={ getAuthorViewsAttributes( controls ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AuthorViews',
	component: AuthorViewsRender,
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
				'The page chart interval the widget sums the daily buckets into. Monthly moves the story range to 90 days, the shortest preset that allows it.',
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
					'The "Author views" widget of the author detail page: the scoped author\'s daily views from `stats/top-authors`, summed into the page\'s chart interval client-side, as a line chart by default. Without an author scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof AuthorViewsRender > & AuthorViewsStoryControls >;

export default meta;

type Story = StoryObj< AuthorViewsStoryControls >;

export const Default: Story = {
	render: renderAuthorViews,
	args: { hasAuthorScope: true, interval: 'day', chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

export const NoAuthorScope: Story = {
	render: renderAuthorViews,
	args: { hasAuthorScope: false, interval: 'day', chartType: 'bar' },
	decorators: [ withWidgetCanvas ],
};

interface AuthorViewsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AuthorViewsStoryControls {}

function AuthorViewsDashboardStory( {
	hasAuthorScope,
	interval,
	chartType,
	...dashboardArgs
}: AuthorViewsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ AUTHOR_VIEWS_RENDER_MODULE }
			renderComponent={ AuthorViewsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getAuthorViewsAttributes( { hasAuthorScope, interval, chartType } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AuthorViewsDashboardStoryProps > = {
	render: args => <AuthorViewsDashboardStory { ...args } />,
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
