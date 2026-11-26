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
import BotActivityRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const RENDER_MODULE = 'storybook/bot-activity';
const ENDPOINT = 'stats/ua-queries';

const storyWidgetType = createStoryWidgetType( widgetManifest );

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderOnPreset( preset: PresetType ) {
	return (
		<BotActivityRender attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

function DashboardRender( props: WidgetRenderProps< unknown > ) {
	return <BotActivityRender { ...( props as ComponentProps< typeof BotActivityRender > ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Bot activity',
	component: BotActivityRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Bot activity" widget of the AI tab. Ranks the bots that requested the site in six groups, from AI training to unidentified bots, over the dashboard date range; a group opens onto its bots. It reads AI bots and the other bots in two requests and ranks them together.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof BotActivityRender > >;

export default meta;

type Story = StoryObj< ComponentProps< typeof BotActivityRender > >;

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
