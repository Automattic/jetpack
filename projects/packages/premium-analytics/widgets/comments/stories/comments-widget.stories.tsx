import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
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
import CommentsRender from '../render';
import widgetDefinition from '../widget';
import type { CommentsView } from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
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
	view: CommentsView;
}

function renderComments( { view }: CommentsStoryControls ) {
	// The close-up story renders the bare widget without the host chrome, so the
	// "View by" control isn't shown here; the `view` control drives the rendered
	// view directly through the (host-owned) `view` attribute.
	return <CommentsRender attributes={ { view, reportParams: getDefaultQueryParams() } } />;
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

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Comments',
	component: CommentsRender,
	tags: [ 'autodocs' ],
	argTypes: {
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
	args: { view: 'authors' },
	decorators: [ withWidgetCanvas ],
};

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: renderComments,
	args: { view: 'authors' },
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
	args: { view: 'authors' },
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
	args: { view: 'authors' },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceCommentsState( 'empty' ),
};

interface CommentsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		CommentsStoryControls {}

function CommentsDashboardStory( { view, ...dashboardArgs }: CommentsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ COMMENTS_RENDER_MODULE }
			renderComponent={ CommentsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { view, reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< CommentsDashboardStoryProps > = {
	render: args => <CommentsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		view: 'authors',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		view: VIEW_CONTROL,
	},
};
