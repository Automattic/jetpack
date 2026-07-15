/**
 * The Post highlights widget is the post detail Traffic view's highlights
 * card: the scoped post's views, comments, and likes as metric tiles. The
 * post scope arrives through `reportParams.post_id` (seeded from the detail
 * page URL in product); the `hasPostScope` control toggles it to exercise the
 * scopeless empty state. Views is period-scoped with a delta when comparison
 * is on; comments and likes are lifetime totals with no per-post history, so
 * their tiles carry a note instead of a delta.
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
import PostDetailHighlightsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// Any post ID resolves to the shared `stats-post` fixture; this one matches
// the fixture's own post row for coherence.
const MOCK_POST_ID = 779;

const POST_DETAIL_HIGHLIGHTS_RENDER_MODULE = 'storybook/post-detail-highlights';

interface PostDetailHighlightsStoryControls {
	withComparison: boolean;
	hasPostScope: boolean;
}

/**
 * Builds the widget attributes: report params with the post scope the detail
 * page seeds from its URL when `hasPostScope` is on.
 *
 * @param {PostDetailHighlightsStoryControls} controls - The story controls.
 * @return The widget attributes.
 */
function getPostDetailHighlightsAttributes( {
	withComparison,
	hasPostScope,
}: PostDetailHighlightsStoryControls ): ComponentProps<
	typeof PostDetailHighlightsRender
>[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( withComparison ),
			...( hasPostScope ? { post_id: MOCK_POST_ID } : {} ),
		},
	};
}

/**
 * Renders the data-connected widget with the composed attributes.
 *
 * @param {PostDetailHighlightsStoryControls} controls - The story controls.
 * @return The rendered widget.
 */
function renderPostDetailHighlights( controls: PostDetailHighlightsStoryControls ) {
	return (
		<PostDetailHighlightsRender attributes={ getPostDetailHighlightsAttributes( controls ) } />
	);
}

// Close-up canvas sized to the tile row outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '160px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/PostDetailHighlights',
	component: PostDetailHighlightsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Post highlights" widget: the scoped post\'s views, comments, and likes as metric tiles — the post detail Traffic view\'s highlights card. Views is period-scoped and carries a delta when comparison is on; comments and likes are lifetime totals with no per-post history, so their tiles show a note instead of a delta. Without a post scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta<
	ComponentProps< typeof PostDetailHighlightsRender > & PostDetailHighlightsStoryControls
>;

export default meta;

type Story = StoryObj< PostDetailHighlightsStoryControls >;

/**
 * Default — the scoped post's highlights for the primary period only; the
 * Views tile shows no delta.
 */
export const Default: Story = {
	render: renderPostDetailHighlights,
	args: { withComparison: false, hasPostScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * WithComparison — the previous-period comparison from the date range picker;
 * the Views tile carries a delta while comments and likes keep the comparison
 * layout without a fabricated delta.
 */
export const WithComparison: Story = {
	render: renderPostDetailHighlights,
	args: { withComparison: true, hasPostScope: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * NoPostScope — the widget without a `post_id` report param, as when added
 * outside a post detail page. Renders the scopeless empty state without
 * firing a stats request.
 */
export const NoPostScope: Story = {
	render: renderPostDetailHighlights,
	args: { withComparison: false, hasPostScope: false },
	decorators: [ withWidgetCanvas ],
};

interface PostDetailHighlightsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		PostDetailHighlightsStoryControls {}

/**
 * Mounts the real `WidgetDashboard` with this single widget so it renders
 * exactly as it does in product (framed card, sizing, host environment).
 *
 * @param {PostDetailHighlightsDashboardStoryProps} props - The dashboard story controls.
 * @return The widget mounted inside the real dashboard.
 */
function PostDetailHighlightsDashboardStory( {
	withComparison,
	hasPostScope,
	...dashboardArgs
}: PostDetailHighlightsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ { ...widgetDefinition, presentation: 'framed' } }
			renderModule={ POST_DETAIL_HIGHLIGHTS_RENDER_MODULE }
			renderComponent={
				PostDetailHighlightsRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ getPostDetailHighlightsAttributes( { withComparison, hasPostScope } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< PostDetailHighlightsDashboardStoryProps > = {
	render: args => <PostDetailHighlightsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 4,
		widgetHeight: 1,
		withComparison: true,
		hasPostScope: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
		hasPostScope: {
			control: 'boolean',
			description: 'Include the `post_id` report param the post detail page seeds from its URL.',
		},
	},
};
