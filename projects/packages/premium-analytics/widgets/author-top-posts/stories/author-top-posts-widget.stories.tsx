/**
 * Served by the shared report mocks' `stats/top-authors` fixture; the story
 * scopes the widget to one of its authors the way the author detail page seeds
 * `author_id` from its URL.
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AuthorTopPostsRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

// An author from the shared fixture; any other id renders the no-views state.
const MOCK_AUTHOR_ID = 101;

const AUTHOR_TOP_POSTS_RENDER_MODULE = 'storybook/author-top-posts';

interface AuthorTopPostsStoryControls {
	hasAuthorScope: boolean;
}

function getAttributes( {
	hasAuthorScope,
}: AuthorTopPostsStoryControls ): ComponentProps< typeof AuthorTopPostsRender >[ 'attributes' ] {
	return {
		reportParams: {
			...getDefaultQueryParams( false ),
			...( hasAuthorScope ? { author_id: MOCK_AUTHOR_ID } : {} ),
		},
	};
}

function renderAuthorTopPosts( controls: AuthorTopPostsStoryControls ) {
	return <AuthorTopPostsRender attributes={ getAttributes( controls ) } />;
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/AuthorTopPosts',
	component: AuthorTopPostsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		hasAuthorScope: {
			control: 'boolean',
			description:
				'Include the `author_id` report param the author detail page seeds from its URL.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Top viewed posts" widget of the author detail page: the scoped author\'s posts ranked by views over the page range, read out of the summarized `stats/top-authors` report. Without an author scope the widget renders a scopeless empty state.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof AuthorTopPostsRender > & AuthorTopPostsStoryControls >;

export default meta;

type Story = StoryObj< AuthorTopPostsStoryControls >;

export const Default: Story = {
	render: renderAuthorTopPosts,
	args: { hasAuthorScope: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const NoAuthorScope: Story = {
	render: renderAuthorTopPosts,
	args: { hasAuthorScope: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

interface AuthorTopPostsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		AuthorTopPostsStoryControls {}

function AuthorTopPostsDashboardStory( {
	hasAuthorScope,
	...dashboardArgs
}: AuthorTopPostsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ AUTHOR_TOP_POSTS_RENDER_MODULE }
			renderComponent={ AuthorTopPostsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getAttributes( { hasAuthorScope } ) }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< AuthorTopPostsDashboardStoryProps > = {
	render: args => <AuthorTopPostsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 3,
		widgetHeight: 2,
		hasAuthorScope: true,
	},
	argTypes: { ...widgetDashboardWithWidgetArgTypes },
	decorators: [ withStoryRouter ],
};
