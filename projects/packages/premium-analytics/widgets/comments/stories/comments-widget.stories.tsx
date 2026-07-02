import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import CommentsRender from '../render';
import widgetDefinition, { type CommentsView } from '../widget';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

const STATS_COMMENTS_PATH = '/jetpack-premium-analytics/v1/proxy/v1.1/stats/comments';

// Raw WPCOM `stats/comments` response shape; the data layer sanitizes it into the
// normalized authors/posts groups the widget reads.
const COMMENTS_MOCK = {
	date: '2026-07-01',
	total_comments: 1284,
	monthly_comments: 96,
	most_active_day: 'Tuesday',
	most_active_time: '15:00',
	authors: [
		{ name: 'Jane Cooper', comments: 128, gravatar: 'https://i.pravatar.cc/64?img=11' },
		{ name: 'Wade Warren', comments: 96, gravatar: 'https://i.pravatar.cc/64?img=12' },
		{ name: 'Esther Howard', comments: 74, gravatar: 'https://i.pravatar.cc/64?img=13' },
		{ name: 'Cameron Williamson', comments: 58, gravatar: 'https://i.pravatar.cc/64?img=14' },
		{ name: 'Brooklyn Simmons', comments: 41, gravatar: 'https://i.pravatar.cc/64?img=15' },
		{ name: 'Leslie Alexander', comments: 27, gravatar: 'https://i.pravatar.cc/64?img=16' },
		{ name: 'Guy Hawkins', comments: 12, gravatar: 'https://i.pravatar.cc/64?img=17' },
	],
	posts: [
		{ id: 101, name: 'Welcome to the blog', comments: 240, link: 'https://example.com/welcome' },
		{ id: 102, name: '10 tips for faster sites', comments: 188, link: 'https://example.com/tips' },
		{ id: 103, name: 'Our 2026 roadmap', comments: 141, link: 'https://example.com/roadmap' },
		{ id: 104, name: 'Behind the scenes', comments: 97, link: 'https://example.com/bts' },
		{ id: 105, name: 'A note on comments', comments: 63, link: 'https://example.com/comments' },
		{ id: 106, name: 'Community spotlight', comments: 34, link: 'https://example.com/spotlight' },
	],
};

// Register a comments-specific middleware last so it runs before the shared
// report/stats mocks (apiFetch runs the most recently registered middleware
// first); it serves the comments fixture and defers everything else.
let commentsMockRegistered = false;
function registerCommentsMock(): void {
	if ( commentsMockRegistered ) {
		return;
	}
	commentsMockRegistered = true;

	const middleware: APIFetchMiddleware = ( options: APIFetchOptions, next ) => {
		const path = options.path ?? options.url ?? '';
		if ( path.startsWith( STATS_COMMENTS_PATH ) ) {
			return Promise.resolve( COMMENTS_MOCK );
		}
		return next( options );
	};

	apiFetch.use( middleware );
}

registerReportMocks();
registerCommentsMock();

const COMMENTS_RENDER_MODULE = 'storybook/comments';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface CommentsStoryControls {
	withComparison: boolean;
	view: CommentsView;
}

interface CommentsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		CommentsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '360px' } }>
		<Story />
	</div>
);

function getCommentsAttributes(
	withComparison: boolean,
	view: CommentsView
): ComponentProps< typeof CommentsRender >[ 'attributes' ] {
	return {
		max: 10,
		initialView: view,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderCommentsWidget( { withComparison, view }: CommentsStoryControls ) {
	// Key on `view` so the initial-view control remounts the widget and switches
	// the tab, while the widget keeps its own tab state during interaction.
	return (
		<CommentsRender key={ view } attributes={ getCommentsAttributes( withComparison, view ) } />
	);
}

function CommentsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <CommentsRender { ...( props as ComponentProps< typeof CommentsRender > ) } />;
}

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
			attributes={ getCommentsAttributes( withComparison, view ) }
		/>
	);
}

const viewControl = {
	control: 'inline-radio' as const,
	options: [ 'authors', 'posts' ],
	description: 'Leaderboard shown first (Authors or Posts).',
};

const withComparisonControl = {
	control: 'boolean' as const,
	description:
		'Include previous-period comparison report params. The comments module has no comparison data, so the widget renders identically.',
};

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Comments',
	component: CommentsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		view: viewControl,
		withComparison: withComparisonControl,
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Comments" widget. Shows the site\'s most active comment authors and most commented posts behind an Authors/Posts toggle. The Stats comments endpoint is date-range agnostic and has no comparison period, so the widget renders the same regardless of the dashboard date range or comparison controls.',
			},
		},
	},
} satisfies Meta< CommentsStoryControls >;

export default meta;

type DashboardStory = StoryObj< CommentsDashboardStoryProps >;

export const Default: StoryObj< CommentsStoryControls > = {
	render: renderCommentsWidget,
	args: { withComparison: false, view: 'authors' },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: StoryObj< CommentsStoryControls > = {
	render: renderCommentsWidget,
	args: { withComparison: true, view: 'authors' },
	decorators: [ withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <CommentsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 1,
		widgetHeight: 2,
		withComparison: true,
		view: 'authors',
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		view: viewControl,
		withComparison: withComparisonControl,
	},
};
