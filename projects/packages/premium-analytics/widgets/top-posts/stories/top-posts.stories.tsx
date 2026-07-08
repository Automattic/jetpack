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
import TopPostsRender from '../render';
import widgetDefinition, { type TopPostsAttributes } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TOP_POSTS_RENDER_MODULE = 'storybook/top-posts';
const DEFAULT_NUM = 10;
const DEFAULT_CONTENT_TYPE: NonNullable< TopPostsAttributes[ 'contentType' ] > = 'posts-pages';

interface TopPostsStoryControls {
	/**
	 * Whether to request the previous-period comparison.
	 */
	withComparison: boolean;
	/**
	 * Top pages source displayed by the widget.
	 */
	contentType: NonNullable< TopPostsAttributes[ 'contentType' ] >;
}

function getTopPostsAttributes( {
	contentType,
	withComparison,
}: TopPostsStoryControls ): ComponentProps< typeof TopPostsRender >[ 'attributes' ] {
	return {
		num: DEFAULT_NUM,
		contentType,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

/**
 * Render the data-connected Top pages widget with report params derived from
 * the story controls, so the close-up stories exercise the real data flow.
 *
 * @param {TopPostsStoryControls} props - Story controls.
 * @return The rendered widget.
 */
function renderTopPosts( props: TopPostsStoryControls ) {
	return <TopPostsRender attributes={ getTopPostsAttributes( props ) } />;
}

function TopPostsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <TopPostsRender { ...( props as ComponentProps< typeof TopPostsRender > ) } />;
}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TopPosts',
	component: TopPostsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		contentType: {
			control: 'select',
			options: [ 'posts-pages', 'archive' ],
			description: 'Select Posts & Pages or Archive rows.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Top pages by views" widget. Renders the most-viewed posts/pages or archive pages for the selected period, with optional period-over-period comparison. The "View by" control is the `contentType` attribute (`relevance: \'high\'`), exposed by the widget host.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopPostsRender > & TopPostsStoryControls >;

export default meta;

type Story = StoryObj< TopPostsStoryControls >;

export const Default: Story = {
	render: renderTopPosts,
	args: {
		contentType: DEFAULT_CONTENT_TYPE,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderTopPosts,
	args: {
		contentType: DEFAULT_CONTENT_TYPE,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
};

export const Archive: Story = {
	render: renderTopPosts,
	args: {
		contentType: 'archive',
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
};

interface TopPostsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TopPostsStoryControls {}

function TopPostsDashboardStory( {
	contentType,
	withComparison,
	...dashboardArgs
}: TopPostsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ TOP_POSTS_RENDER_MODULE }
			renderComponent={ TopPostsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getTopPostsAttributes( { contentType, withComparison } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< TopPostsDashboardStoryProps > = {
	render: args => <TopPostsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		contentType: DEFAULT_CONTENT_TYPE,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		contentType: {
			control: 'select',
			options: [ 'posts-pages', 'archive' ],
			description: 'Select Posts & Pages or Archive rows.',
		},
	},
};
