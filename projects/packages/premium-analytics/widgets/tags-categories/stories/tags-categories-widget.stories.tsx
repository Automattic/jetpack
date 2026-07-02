/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
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
import TagsCategoriesRender from '../render';
import widgetDefinition from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();

// The shared `registerReportMocks` middleware has no `stats/tags` handler, so
// without a widget-scoped mock these stories render the empty state. Serve a raw
// WPCOM `stats/tags` response here — the query pipeline runs it through the same
// `tags` sanitizer as production. Single tags/categories carry an archive link;
// a grouped row (several tags/categories combined on one post) has no single
// archive URL, so the widget renders it as plain text.
const STATS_TAGS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/tags';

const mockStatsTagsResponse = {
	date: '2024-01-07',
	tags: [
		{
			tags: [
				{
					type: 'category',
					name: 'Announcements',
					link: 'https://example.com/category/announcements/',
				},
			],
			views: 1240,
		},
		{
			tags: [ { type: 'tag', name: 'wordpress', link: 'https://example.com/tag/wordpress/' } ],
			views: 980,
		},
		{
			tags: [
				{ type: 'category', name: 'Tutorials', link: 'https://example.com/category/tutorials/' },
			],
			views: 845,
		},
		{
			tags: [
				{ type: 'tag', name: 'design', link: 'https://example.com/tag/design/' },
				{ type: 'tag', name: 'ux', link: 'https://example.com/tag/ux/' },
			],
			views: 610,
		},
		{
			tags: [ { type: 'tag', name: 'performance', link: 'https://example.com/tag/performance/' } ],
			views: 432,
		},
		{
			tags: [
				{
					type: 'category',
					name: 'Product Updates',
					link: 'https://example.com/category/product-updates/',
				},
			],
			views: 318,
		},
		{
			tags: [
				{ type: 'tag', name: 'accessibility', link: 'https://example.com/tag/accessibility/' },
			],
			views: 205,
		},
	],
};

let statsTagsMockRegistered = false;

/**
 * Registers a widget-scoped `apiFetch` middleware that serves the mock
 * `stats/tags` response. Idempotent, so hot reloads do not stack middlewares.
 */
function registerStatsTagsMock(): void {
	if ( statsTagsMockRegistered ) {
		return;
	}
	statsTagsMockRegistered = true;

	const middleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
		const requestPath = options.path ?? options.url ?? '';

		if ( requestPath.startsWith( STATS_TAGS_PATH ) ) {
			return Promise.resolve( mockStatsTagsResponse );
		}

		return next( options );
	};

	apiFetch.use( middleware );
}

registerStatsTagsMock();

const TAGS_CATEGORIES_RENDER_MODULE = 'storybook/tags-categories';

const DEFAULT_MAX = 10;

// Widget-specific story control. The Stats `tags` endpoint has no comparison
// period, so `withComparison` only exercises the date picker's comparison
// params — the leaderboard renders single-period values either way.
interface TagsCategoriesStoryControls {
	withComparison: boolean;
}

/**
 * Render the data-connected Tags & categories widget with report params derived
 * from the `withComparison` control, so the close-up stories exercise the real
 * data flow (served by the widget-scoped `stats/tags` mock above).
 *
 * @param props                - Story controls.
 * @param props.withComparison - Whether to request the previous-period comparison.
 * @return The rendered widget.
 */
function renderTagsCategories( { withComparison }: TagsCategoriesStoryControls ) {
	return (
		<TagsCategoriesRender
			attributes={ { max: DEFAULT_MAX, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Close-up canvas so the leaderboard fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/TagsCategories',
	component: TagsCategoriesRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					"Dashboard widget showing the site's most viewed tags and categories as a leaderboard, sourced from the Jetpack Stats `tags` module via `useStatsTags`. Single tags/categories link to their archive; grouped rows render as plain text. The Stats `tags` endpoint has no comparison period, so no period-over-period deltas are shown. In Storybook the data is served by a widget-scoped `stats/tags` mock.",
			},
		},
	},
} satisfies Meta< TagsCategoriesStoryControls >;

export default meta;

type Story = StoryObj< TagsCategoriesStoryControls >;

/**
 * The widget on its own, current period only.
 */
export const Default: Story = {
	render: renderTagsCategories,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Same close-up with comparison report params from the date range picker. The
 * Stats `tags` endpoint returns no comparison rows, so the leaderboard renders
 * the same single-period values without deltas — this story verifies the widget
 * stays graceful when comparison params are present.
 */
export const WithComparison: Story = {
	render: renderTagsCategories,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The tags module has no comparison data to display; the widget renders single-period values even when comparison params are set.',
			},
		},
	},
};

interface TagsCategoriesDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		TagsCategoriesStoryControls {}

/**
 * Renders the real registered widget through the shared dashboard harness, so
 * it appears exactly as it does in product, inheriting the size / edit-mode /
 * host-environment controls.
 *
 * @param props                - Story controls.
 * @param props.withComparison - Whether to request the previous-period comparison.
 * @return The widget mounted in the dashboard harness.
 */
function TagsCategoriesDashboardStory( {
	withComparison,
	...dashboardArgs
}: TagsCategoriesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ TAGS_CATEGORIES_RENDER_MODULE }
			renderComponent={ TagsCategoriesRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: DEFAULT_MAX, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< TagsCategoriesDashboardStoryProps > = {
	render: args => <TagsCategoriesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: false,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
