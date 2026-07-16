import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import {
	registerReportMocks,
	setReportMockState,
} from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AuthorsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const AUTHORS_RENDER_MODULE = 'storybook/authors';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface AuthorsStoryControls {
	withComparison: boolean;
}

function renderAuthors( { withComparison }: AuthorsStoryControls ) {
	return (
		<AuthorsRender
			attributes={ { max: 7, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderAuthorsOnPreset( preset: PresetType ) {
	return (
		<AuthorsRender
			attributes={ { max: 7, reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function AuthorsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <AuthorsRender { ...( props as ComponentProps< typeof AuthorsRender > ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Authors',
	component: AuthorsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Authors" widget. Displays top authors by views from the Jetpack Stats top-authors endpoint. Rows show author avatars and drill down into linked post rows; comparison mode carries period-over-period deltas into both author and post views.',
			},
		},
	},
	// The story args are the widget-specific controls, but `component` is the
	// render component (host `WidgetRenderProps`). Intersect the two so
	// `component` type-checks against the meta while the controls drive argTypes.
} satisfies Meta< ComponentProps< typeof AuthorsRender > & AuthorsStoryControls >;

export default meta;

type Story = StoryObj< AuthorsStoryControls >;

export const Default: Story = {
	render: renderAuthors,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderAuthors,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderAuthorsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/top-authors', 'loading' );
		return () => setReportMockState( 'stats/top-authors', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderAuthorsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/top-authors', 'error' );
		return () => setReportMockState( 'stats/top-authors', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral author
 * glyph and the introductory description).
 */
export const Empty: Story = {
	render: () => renderAuthorsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/top-authors', 'empty' );
		return () => setReportMockState( 'stats/top-authors', null );
	},
};

interface AuthorsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AuthorsStoryControls {}

function AuthorsDashboardStory( { withComparison, ...dashboardArgs }: AuthorsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ AUTHORS_RENDER_MODULE }
			renderComponent={ AuthorsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 7, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AuthorsDashboardStoryProps > = {
	render: args => <AuthorsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
