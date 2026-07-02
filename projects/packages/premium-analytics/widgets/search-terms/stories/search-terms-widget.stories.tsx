import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
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
	presentation: 'full-bleed' as const,
};

interface SearchTermsStoryControls {
	withComparison: boolean;
}

function renderSearchTerms( { withComparison }: SearchTermsStoryControls ) {
	return (
		<SearchTermsRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
			showTitle={ false }
		/>
	);
}

function SearchTermsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <SearchTermsRender { ...( props as ComponentProps< typeof SearchTermsRender > ) } />;
}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
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
} satisfies Meta< SearchTermsStoryControls >;

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
