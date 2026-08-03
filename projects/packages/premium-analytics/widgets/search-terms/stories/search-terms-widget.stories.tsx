import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import SearchTermsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SEARCH_TERMS_RENDER_MODULE = 'storybook/search-terms';

// Build the story widget type from its manifest and module. `presentation`
// comes from widget.json ( 'framed' ), so the host frames the widget.
const storyWidgetType = createStoryWidgetType( widgetManifest, widgetDefinition );

interface SearchTermsStoryControls {
	withComparison: boolean;
}

function renderSearchTerms( { withComparison }: SearchTermsStoryControls ) {
	return (
		<SearchTermsRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderSearchTermsOnPreset( preset: PresetType ) {
	return (
		<SearchTermsRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( false, preset ) } }
		/>
	);
}

function SearchTermsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <SearchTermsRender { ...( props as ComponentProps< typeof SearchTermsRender > ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/SearchTerms',
	component: SearchTermsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Search Terms" widget. Displays the top search queries visitors used to reach the site, ranked by view count. Ported from the Jetpack Stats Search Terms module.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SearchTermsRender > & SearchTermsStoryControls >;

export default meta;

type Story = StoryObj< SearchTermsStoryControls >;

export const Default: Story = {
	render: renderSearchTerms,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WithComparison: Story = {
	render: renderSearchTerms,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderSearchTermsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/search-terms', 'loading' );
		return () => setReportMockState( 'stats/search-terms', null );
	},
};

/**
 * The fetch failed with a permission-gated 403: the widget shows the neutral
 * "You don't have access to this data." copy and no Retry action, since a
 * permission gate is deterministic and retrying cannot clear it.
 */
export const Error: Story = {
	render: () => renderSearchTermsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/search-terms', 'error' );
		return () => setReportMockState( 'stats/search-terms', null );
	},
};

/**
 * The fetch failed in a way that can heal — the proxy's `no_connection` 403: the
 * widget shows its retryable copy with a Retry action, which re-runs the query
 * (still mocked as failing while this story is active).
 */
export const ErrorRetryable: Story = {
	render: () => renderSearchTermsOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/search-terms', 'error-retryable' );
		return () => setReportMockState( 'stats/search-terms', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral search
 * glyph and "No search terms in this period.").
 */
export const Empty: Story = {
	render: () => renderSearchTermsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas, withStoryRouter ],
	beforeEach: () => {
		setReportMockState( 'stats/search-terms', 'empty' );
		return () => setReportMockState( 'stats/search-terms', null );
	},
};

interface SearchTermsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SearchTermsStoryControls {}

function SearchTermsDashboardStory( {
	withComparison,
	...dashboardArgs
}: SearchTermsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SEARCH_TERMS_RENDER_MODULE }
			renderComponent={
				SearchTermsDashboardRender as ComponentType< WidgetRenderProps< unknown > >
			}
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< SearchTermsDashboardStoryProps > = {
	render: args => <SearchTermsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
