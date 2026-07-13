import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import CommentsRender from '../render';
import widgetDefinition from '../widget';
import type { CommentsView } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const COMMENTS_RENDER_MODULE = 'storybook/comments';

// Pick only the fields that StoryWidgetMetadata accepts; the attribute schema
// and example arrays are typed differently in WidgetType and cause a type error.
const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

const VIEW_CONTROL = {
	control: 'inline-radio' as const,
	options: [ 'authors', 'posts' ] as CommentsView[],
};

interface CommentsStoryControls {
	withComparison: boolean;
	view: CommentsView;
}

function renderComments( { withComparison, view }: CommentsStoryControls ) {
	// `view` seeds the widget's initial selection, held in local state. Keying the
	// render on it remounts the widget when the control changes so the selector
	// reflects the control rather than pinning the first-mount value.
	return (
		<CommentsRender
			key={ view }
			attributes={ { view, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function CommentsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <CommentsRender { ...( props as ComponentProps< typeof CommentsRender > ) } />;
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
	title: 'Packages/Premium Analytics/Widgets/Comments',
	component: CommentsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		view: VIEW_CONTROL,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Comments" widget. Ranks the site\'s comment authors and its most-commented posts and pages by comment count, switchable through an in-widget "By authors" / "By posts & pages" selector. Ported from the Jetpack Stats Comments module.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof CommentsRender > & CommentsStoryControls >;

export default meta;

type Story = StoryObj< CommentsStoryControls >;

export const Default: Story = {
	render: renderComments,
	args: { withComparison: false, view: 'authors' },
	decorators: [ withWidgetCanvas ],
};

/**
 * The Comments endpoint is all-time and returns no comparison rows, so enabling
 * the date-range picker's comparison parameters renders the widget identically
 * to `Default` — no period-over-period deltas are shown.
 */
export const WithComparison: Story = {
	render: renderComments,
	args: { withComparison: true, view: 'authors' },
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			description: {
				story:
					'The Stats Comments module has no comparison data, so this renders the same as Default without fabricated deltas.',
			},
		},
	},
};

interface CommentsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		CommentsStoryControls {}

function CommentsDashboardStory( {
	withComparison,
	view,
	...dashboardArgs
}: CommentsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			key={ view }
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ COMMENTS_RENDER_MODULE }
			renderComponent={ CommentsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { view, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< CommentsDashboardStoryProps > = {
	render: args => <CommentsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
		view: 'authors',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
		view: VIEW_CONTROL,
	},
};
