import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import TopAiPagesRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const RENDER_MODULE = 'storybook/top-ai-pages';
const ENDPOINT = 'stats/ua-queries';

const storyWidgetType = createStoryWidgetType( widgetManifest );

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderOnPreset( preset: PresetType ) {
	return (
		<TopAiPagesRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

function DashboardRender( props: WidgetRenderProps< unknown > ) {
	return <TopAiPagesRender { ...( props as ComponentProps< typeof TopAiPagesRender > ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Top pages by AI bot requests',
	component: TopAiPagesRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Top pages by AI bot requests" widget of the AI tab. Ranks the URLs AI bots requested most in the dashboard date range, each linking to its page.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof TopAiPagesRender > >;

export default meta;

type Story = StoryObj< ComponentProps< typeof TopAiPagesRender > >;

export const Default: Story = {
	render: () => renderOnPreset( 'last-30-days' ),
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: () => renderOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'loading' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const Error: Story = {
	render: () => renderOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'error' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const ErrorRetryable: Story = {
	render: () => renderOnPreset( 'last-12-months' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'error-retryable' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const Empty: Story = {
	render: () => renderOnPreset( 'last-year' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( ENDPOINT, 'empty' );
		return () => forceStatsMockState( ENDPOINT, null );
	},
};

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	tags: [ 'widget-dashboard' ],
	render: args => (
		<WidgetDashboardWithWidgetStory
			{ ...args }
			widgetType={ storyWidgetType }
			renderModule={ RENDER_MODULE }
			renderComponent={ DashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( false ) } }
		/>
	),
	args: DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	argTypes: widgetDashboardWithWidgetArgTypes,
};
