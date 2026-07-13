import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
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
import SearchTermsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SEARCH_TERMS_RENDER_MODULE = 'storybook/search-terms';

// Pick only the fields that StoryWidgetMetadata accepts; the attribute schema
// and example arrays are typed differently in WidgetType and cause a type error.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

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

// Renders the widget on a preset distinct from the other stories. The query key
// derives from the date range, so a unique preset gives the forced-state stories
// their own cache entry and they hit the mock fresh instead of reading another
// story's cached success from the shared query client.
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

// Close-up frame: a white, widget-sized card so each state reads the way it does
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
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderSearchTerms,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderSearchTermsOnPreset( 'last-90-days' ),
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/search-terms', 'loading' );
		return () => setReportMockState( 'stats/search-terms', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderSearchTermsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		setReportMockState( 'stats/search-terms', 'error' );
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
	decorators: [ withWidgetCanvas ],
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
