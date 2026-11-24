/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import DataViewsRender, { type DataViewsAttributes } from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const DATA_VIEWS_RENDER_MODULE = 'storybook/data-views';

const POSTS_VARIATION = {
	...widgetManifest,
	name: 'jpa/data-views--posts',
	icon: 'jpa/page',
	title: 'Posts & Pages',
};

const POSTS_ATTRIBUTES: DataViewsAttributes = {
	source: 'jpa/posts',
	view: {
		titleField: 'title',
		mediaField: 'thumbnail',
		fields: [ 'views' ],
		sort: { field: 'views', direction: 'desc' },
		layout: { styles: { views: { align: 'end' } } },
	},
};

interface DataViewsStoryControls {
	withComparison: boolean;
}

interface DataViewsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, DataViewsStoryControls {}

function renderDataViewsWidget( { withComparison }: DataViewsStoryControls ) {
	return (
		<DataViewsRender
			attributes={ { ...POSTS_ATTRIBUTES, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function DataViewsDashboardStory( {
	withComparison,
	...dashboardArgs
}: DataViewsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( POSTS_VARIATION ) }
			renderModule={ DATA_VIEWS_RENDER_MODULE }
			renderComponent={ DataViewsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { ...POSTS_ATTRIBUTES, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/DataViews',
	component: DataViewsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'A wrapper of DataViews: the table of the source an instance names, in the view it carries. These stories mount its Posts & Pages variation, the table of the All pages report: every post and page of the period with its views, searchable, sortable and paginated inside the tile. Each title opens the post’s own report.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof DataViewsRender > & DataViewsStoryControls >;

export default meta;

type Story = StoryObj< DataViewsStoryControls >;
type DashboardStory = StoryObj< DataViewsDashboardStoryProps >;

export const Default: Story = {
	render: renderDataViewsWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WithComparison: Story = {
	render: renderDataViewsWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <DataViewsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};
