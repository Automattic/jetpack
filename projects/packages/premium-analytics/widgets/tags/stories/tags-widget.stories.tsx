import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import TagsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TAGS_RENDER_MODULE = 'storybook/tags';

// Pick only the fields that StoryWidgetMetadata accepts; the attribute schema
// and example arrays are typed differently in WidgetType and cause a type error.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface TagsStoryControls {
	withComparison: boolean;
}

function renderTags( { withComparison }: TagsStoryControls ) {
	return (
		<TagsRender attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

// Renders the widget with a distinct `max` so each forced-state story gets its
// own cache entry. The `stats/tags` query key collapses the date range to just
// `{ date, max }` (the range's end date), so every "last N days" preset ending
// today resolves to the SAME key — a distinct preset would NOT isolate these
// stories (unlike date-range-keyed widgets). `max` IS in the key, and it doesn't
// change what a loading/error/empty state renders, so it is the reliable
// isolator: without it the Loading story's never-resolving query would poison
// Default (and Empty/Error would leave cached rows) on same-tab story switches.
function renderTagsWithMax( max: number ) {
	return <TagsRender attributes={ { max, reportParams: getDefaultQueryParams( false ) } } />;
}

function TagsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <TagsRender { ...( props as ComponentProps< typeof TagsRender > ) } />;
}

// Close-up frame: a white, widget-sized card so the widget reads the way it does
// as a real dashboard widget (in product the host supplies this frame).
const withWidgetCanvas: Decorator = Story => (
	<div
		style={ {
			width: '380px',
			height: '520px',
			margin: '0 auto',
			padding: '16px',
			boxSizing: 'border-box',
			background: '#fff',
			border: '1px solid #e0e0e0',
			borderRadius: '8px',
			overflow: 'hidden',
		} }
	>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Tags',
	component: TagsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Tags & categories" widget. Displays the site\'s most visited tags and categories for the selected period, ranked by views. Single tags/categories link to their archive; grouped rows (several tags/categories sharing posts) drill down to their members. Ported from the Jetpack Stats Tags & categories module.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TagsRender > & TagsStoryControls >;

export default meta;

type Story = StoryObj< TagsStoryControls >;

export const Default: Story = {
	render: renderTags,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * The date range picker's comparison parameters are passed through, but the Stats
 * `tags` endpoint has no comparison period, so the widget renders single-period
 * values only — no period-over-period deltas are shown.
 */
export const WithComparison: Story = {
	render: renderTags,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The `tags` endpoint returns no comparison rows, so no deltas are shown even when the date range picker enables a comparison period.',
			},
		},
	},
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderTagsWithMax( 9 ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/tags', 'loading' );
		return () => setReportMockState( 'stats/tags', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderTagsWithMax( 8 ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/tags', 'error' );
		return () => setReportMockState( 'stats/tags', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral tag glyph
 * and "Learn about your most visited tags & categories to track engaging topics.").
 */
export const Empty: Story = {
	render: () => renderTagsWithMax( 7 ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/tags', 'empty' );
		return () => setReportMockState( 'stats/tags', null );
	},
};

interface TagsDashboardStoryProps extends WidgetDashboardWithWidgetControls, TagsStoryControls {}

function TagsDashboardStory( { withComparison, ...dashboardArgs }: TagsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TAGS_RENDER_MODULE }
			renderComponent={ TagsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< TagsDashboardStoryProps > = {
	render: args => <TagsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
