import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import TagsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const TAGS_RENDER_MODULE = 'storybook/tags';

// Build the story widget type from its manifest and module. `presentation`
// comes from widget.json ( 'framed' ), so the host frames the widget.
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

function renderTags() {
	return <TagsRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

function TagsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <TagsRender { ...( props as ComponentProps< typeof TagsRender > ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Tags',
	component: TagsRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Tags & categories" widget. Displays the site\'s most visited tags and categories over the seven days ending yesterday, ranked by views — the endpoint takes no date parameters, so the section\'s date filter does not reach it. Single tags/categories link to their archive; grouped rows (several tags/categories sharing posts) drill down to their members. Ported from the Jetpack Stats Tags & categories module.',
			},
		},
	},
} satisfies Meta< typeof TagsRender >;

export default meta;

type Story = StoryObj< Partial< ComponentProps< typeof TagsRender > > >;

export const Default: Story = {
	render: renderTags,
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderTags,
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
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
	render: renderTags,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
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
	render: renderTags,
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/tags', 'empty' );
		return () => setReportMockState( 'stats/tags', null );
	},
};

function TagsDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ TAGS_RENDER_MODULE }
			renderComponent={ TagsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <TagsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
	decorators: [ withStoryRouter ],
};
