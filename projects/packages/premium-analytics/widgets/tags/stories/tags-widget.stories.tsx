import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
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
