import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import TopPlatformsRender from '../render';
import widgetDefinition, { type TopPlatformsAttributes } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const TOP_PLATFORMS_RENDER_MODULE = 'storybook/top-platforms';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	// attributes/example let the dashboard host render the real "View by"
	// toolbar control for the `relevance: 'high'` attribute, as in Locations.
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
	presentation: 'framed' as const,
};

interface TopPlatformsStoryControls {
	withComparison: boolean;
	platformDimension: NonNullable< TopPlatformsAttributes[ 'platformDimension' ] >;
}

interface TopPlatformsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPlatformsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getTopPlatformsAttributes( {
	withComparison,
	platformDimension,
}: TopPlatformsStoryControls ): ComponentProps< typeof TopPlatformsRender >[ 'attributes' ] {
	return {
		max: 10,
		platformDimension,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderTopPlatformsWidget( controls: TopPlatformsStoryControls ) {
	return <TopPlatformsRender attributes={ getTopPlatformsAttributes( controls ) } />;
}

function TopPlatformsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <TopPlatformsRender { ...( props as ComponentProps< typeof TopPlatformsRender > ) } />;
}

function TopPlatformsDashboardStory( {
	withComparison,
	platformDimension,
	...dashboardArgs
}: TopPlatformsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TOP_PLATFORMS_RENDER_MODULE }
			renderComponent={
				TopPlatformsDashboardRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getTopPlatformsAttributes( { withComparison, platformDimension } ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPlatforms',
	component: TopPlatformsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		platformDimension: {
			control: 'radio',
			options: [ 'browser', 'platform' ],
			description: 'The "View by" toolbar attribute rendered by the widget host.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Top Platforms" widget. Shows browser and OS breakdown as a ranked leaderboard. The active dimension is the `platformDimension` attribute (`relevance: \'high\'`), exposed as a control by the widget host.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopPlatformsRender > & TopPlatformsStoryControls >;

export default meta;

type DashboardStory = StoryObj< TopPlatformsDashboardStoryProps >;

export const Default: StoryObj< TopPlatformsStoryControls > = {
	render: renderTopPlatformsWidget,
	args: { withComparison: false, platformDimension: 'browser' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: StoryObj< TopPlatformsStoryControls > = {
	render: renderTopPlatformsWidget,
	args: { withComparison: true, platformDimension: 'browser' },
	decorators: [ withWidgetCanvas ],
};

// OS view — the `platformDimension` attribute set to operating systems.
export const ByOS: StoryObj< TopPlatformsStoryControls > = {
	render: renderTopPlatformsWidget,
	args: { withComparison: false, platformDimension: 'platform' },
	decorators: [ withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <TopPlatformsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		platformDimension: 'browser',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		platformDimension: {
			control: 'radio',
			options: [ 'browser', 'platform' ],
			description: 'The "View by" toolbar attribute rendered by the widget host.',
		},
	},
};
