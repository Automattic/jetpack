/**
 * The Traffic activity widget is the post detail Traffic view's activity
 * card: the scoped post's daily views over the dashboard date range as a
 * calendar heatmap (week columns, weekday rows, view counts in the cells).
 * The post scope arrives through `reportParams.post_id` (seeded from the
 * detail page URL in product); the `hasPostScope` control toggles it to
 * exercise the scopeless empty state. Days without traffic stay blank
 * cells, per the design, while the grid stays complete.
 *
 * Data comes from the proxied `stats/post/{id}` endpoint, covered by the
 * shared report mocks' `stats-post` fixture (a deterministic daily series
 * ending today, so relative date presets always intersect it).
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
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import PostTrafficActivityRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_TRAFFIC_ACTIVITY_RENDER_MODULE = 'storybook/post-traffic-activity';

interface PostTrafficActivityStoryControls {
	hasPostScope: boolean;
	preset: 'last-30-days' | 'last-365-days';
}

/**
 * Builds the widget attributes: report params with the post scope the detail
 * page seeds from its URL when `hasPostScope` is on.
 *
 * @param {PostTrafficActivityStoryControls} controls       - The story controls.
 * @param {boolean}                          withComparison - Include comparison report params.
 * @return The widget attributes.
 */
function getPostTrafficActivityAttributes(
	{ hasPostScope, preset }: PostTrafficActivityStoryControls,
	withComparison = false
): ComponentProps< typeof PostTrafficActivityRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( withComparison, preset ),
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

/**
 * Renders the data-connected widget with the composed attributes.
 *
 * @param {PostTrafficActivityStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPostTrafficActivity( controls: PostTrafficActivityStoryControls ) {
	return <PostTrafficActivityRender attributes={ getPostTrafficActivityAttributes( controls ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostTrafficActivity',
	component: PostTrafficActivityRender,
	tags: [ 'autodocs' ],
	argTypes: {
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
		preset: {
			control: 'select',
			options: [ 'last-30-days', 'last-365-days' ],
			description: 'Dashboard date range used to exercise single-page and paged layouts.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Traffic activity" widget: the scoped post\'s daily views over the dashboard date range as a calendar heatmap — the post detail Traffic view\'s activity card, replacing the legacy months table. Days without traffic stay blank cells, per the design, while the grid stays complete. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof PostTrafficActivityRender > & PostTrafficActivityStoryControls
>;

export default meta;

type Story = StoryObj< PostTrafficActivityStoryControls >;

/**
 * Default — the scoped post's daily view heatmap for the dashboard range.
 */
export const Default: Story = {
	render: renderPostTrafficActivity,
	args: { hasPostScope: true, preset: 'last-30-days' },
	decorators: [ withWidgetCanvas ],
};

/**
 * Paged — a deterministic year-long range that always exceeds one page at
 * the default story width, exposing both pager controls for direct review.
 */
export const Paged: Story = {
	render: renderPostTrafficActivity,
	args: { hasPostScope: true, preset: 'last-365-days' },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostTrafficActivity,
	args: { hasPostScope: false, preset: 'last-30-days' },
	decorators: [ withWidgetCanvas ],
};

interface PostTrafficActivityDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostTrafficActivityStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, host environment).
 *
 * @param {PostTrafficActivityDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostTrafficActivityDashboardStory( {
	hasPostScope,
	preset,
	...dashboardArgs
}: PostTrafficActivityDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_TRAFFIC_ACTIVITY_RENDER_MODULE }
			renderComponent={ PostTrafficActivityRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getPostTrafficActivityAttributes( { hasPostScope, preset }, true ) }
		/>
	);
}

/**
 * Mirrors the production placement (full width × 2 rows).
 */
export const WidgetDashboardWithWidget: StoryObj< PostTrafficActivityDashboardStoryProps > = {
	render: args => <PostTrafficActivityDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 4,
		widgetHeight: 2,
		hasPostScope: true,
		preset: 'last-30-days',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
		preset: {
			control: 'select',
			options: [ 'last-30-days', 'last-365-days' ],
			description: 'Dashboard date range used to exercise single-page and paged layouts.',
		},
	},
};
