import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import LocationsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const LOCATIONS_RENDER_MODULE = 'storybook/locations';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'full-bleed' as const,
};

interface LocationsStoryControls {
	withComparison: boolean;
}

interface LocationsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		LocationsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

function getLocationsAttributes(
	withComparison = false
): ComponentProps< typeof LocationsRender >[ 'attributes' ] {
	return {
		max: 10,
		reportParams: getDefaultQueryParams( withComparison ),
	};
}

function renderLocationsWidget( { withComparison }: LocationsStoryControls ) {
	return <LocationsRender attributes={ getLocationsAttributes( withComparison ) } />;
}

function LocationsDashboardRender( props: WidgetRenderProps< unknown > ) {
	return <LocationsRender { ...( props as ComponentProps< typeof LocationsRender > ) } />;
}

function LocationsDashboardStory( {
	withComparison,
	...dashboardArgs
}: LocationsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ LOCATIONS_RENDER_MODULE }
			renderComponent={ LocationsDashboardRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ getLocationsAttributes( withComparison ) }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/Locations',
	component: LocationsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Locations" widget. Shows visitor views by country or city, with country drill-down into regions, using the global dashboard date range.',
			},
		},
	},
} satisfies Meta< LocationsStoryControls >;

export default meta;

type DashboardStory = StoryObj< LocationsDashboardStoryProps >;

export const Default: StoryObj< LocationsStoryControls > = {
	render: renderLocationsWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: StoryObj< LocationsStoryControls > = {
	render: renderLocationsWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <LocationsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		widgetWidth: 2,
		widgetHeight: 1,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
};
