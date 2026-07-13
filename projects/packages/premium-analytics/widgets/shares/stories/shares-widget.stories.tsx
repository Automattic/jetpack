/**
 * The Shares widget lists each social network the site's content was shared to,
 * ranked by share count. Data comes from the all-time site summary via
 * `useStatsSite`; the summary has no date range or comparison period, so the
 * widget shows the same counts regardless of the dashboard's comparison state.
 */
/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import SharesRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const SHARES_RENDER_MODULE = 'storybook/shares';

// Pick only the fields that StoryWidgetMetadata accepts; the attribute schema and
// example arrays are typed differently in WidgetType and cause a type error.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface SharesStoryControls {
	withComparison: boolean;
}

function renderShares( { withComparison }: SharesStoryControls ) {
	return (
		<SharesRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function SharesDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <SharesRender { ...( props as ComponentProps< typeof SharesRender > ) } />;
}

// Close-up frame: a white, widget-sized card so the leaderboard reads the way it
// does as a real dashboard widget (in product the host supplies this frame).
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
	title: 'Packages/Premium Analytics/Widgets/Shares',
	component: SharesRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Shares" widget. Lists each social network the site\'s content was shared to, ranked by share count. Ported from the Jetpack Stats Shares module.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SharesRender > & SharesStoryControls >;

export default meta;

type Story = StoryObj< SharesStoryControls >;

/**
 * The widget on its own, populated from the mocked site summary.
 */
export const Default: Story = {
	render: renderShares,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

/**
 * Comparison state — the dashboard's comparison `reportParams` are present, but the
 * site summary has no comparison period, so the widget renders the same current
 * counts without period-over-period deltas.
 */
export const WithComparison: Story = {
	render: renderShares,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The Shares module has no comparison data, so no period-over-period deltas are shown.',
			},
		},
	},
};

interface SharesDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		SharesStoryControls {}

function SharesDashboardStory( { withComparison, ...dashboardArgs }: SharesDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SHARES_RENDER_MODULE }
			renderComponent={ SharesDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

/**
 * Renders the real registered widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: StoryObj< SharesDashboardStoryProps > = {
	render: args => <SharesDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
