import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
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
import CommentsRender from '../render';
import widgetDefinition from '../widget';
import type { CommentsView } from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps, WidgetType } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const COMMENTS_RENDER_MODULE = 'storybook/comments';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	// attributes/example let the dashboard host render the real "View by" header
	// control for the `relevance: 'high'` attribute, as in Top Platforms.
	attributes: widgetDefinition.attributes as WidgetType[ 'attributes' ],
	example: widgetDefinition.example,
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
	// The close-up story renders the bare widget without the host chrome, so the
	// "View by" control isn't shown here; the `view` control drives the rendered
	// view directly through the (host-owned) `view` attribute.
	return (
		<CommentsRender
			attributes={ { view, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function CommentsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <CommentsRender { ...( props as ComponentProps< typeof CommentsRender > ) } />;
}

// The `stats/comments` endpoint is all-time, so its React Query key does not vary
// by date. The shared query client would otherwise let a forced-state story read
// a sibling story's cached success, so the cache is cleared around the story to
// guarantee a fresh fetch that hits the forced mock.
const COMMENTS_QUERY_KEY = [ 'stats', 'comments' ];

function forceCommentsState( state: 'loading' | 'error' | 'empty' ) {
	return () => {
		queryClient.removeQueries( { queryKey: COMMENTS_QUERY_KEY } );
		setReportMockState( 'stats/comments', state );

		return () => {
			setReportMockState( 'stats/comments', null );
			queryClient.removeQueries( { queryKey: COMMENTS_QUERY_KEY } );
		};
	};
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
					'The "Comments" widget. Ranks the site\'s comment authors and its most-commented posts and pages by comment count. The active view is the host-rendered "View by" header control (Authors / Posts & pages). Ported from the Jetpack Stats Comments module.',
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

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderComments,
	args: { withComparison: false, view: 'authors' },
	// Kept off the shared autodocs page: the mock override is keyed by path, so it
	// would otherwise force the sibling stories on that page into the same state.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceCommentsState( 'loading' ),
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const ErrorState: Story = {
	render: renderComments,
	args: { withComparison: false, view: 'authors' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceCommentsState( 'error' ),
};

/**
 * Resolved with no rows: the widget shows its empty state (the neutral comment
 * glyph and "Learn about the comments your site receives…").
 */
export const Empty: Story = {
	render: renderComments,
	args: { withComparison: false, view: 'authors' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceCommentsState( 'empty' ),
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
