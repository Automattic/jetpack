import { getDefaultQueryParams, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '@jetpack-premium-analytics/datetime';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import VisitorsByLocationRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const VISITORS_BY_LOCATION_RENDER_MODULE = 'storybook/visitors-by-location';
const DEFAULT_PRESET = 'last-30-days' satisfies SelectablePresetId;
const PRESET_OPTIONS = SELECTABLE_PRESETS;

type VisitorsByLocationWidgetProps = ComponentProps< typeof VisitorsByLocationRender >;

interface VisitorsByLocationStoryControls {
	withComparison: boolean;
	preset: SelectablePresetId;
}

type VisitorsByLocationStoryProps = VisitorsByLocationWidgetProps & VisitorsByLocationStoryControls;

interface VisitorsByLocationDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		VisitorsByLocationStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<GlobalErrorProvider>
		<div style={ { width: '100%', height: '300px' } }>
			<Story />
		</div>
	</GlobalErrorProvider>
);

function getVisitorsByLocationAttributes(
	withComparison = false,
	preset: SelectablePresetId = DEFAULT_PRESET
): VisitorsByLocationWidgetProps[ 'attributes' ] {
	return {
		reportParams: getDefaultQueryParams( withComparison, preset ),
	};
}

function getDefaultQueryParamsSource( {
	withComparison,
	preset,
}: Partial< VisitorsByLocationStoryControls > ) {
	const hasComparison = Boolean( withComparison );
	const storyPreset = preset ?? DEFAULT_PRESET;

	if ( ! hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams()';
	}

	if ( hasComparison && storyPreset === DEFAULT_PRESET ) {
		return 'getDefaultQueryParams( true )';
	}

	return `getDefaultQueryParams( ${ hasComparison ? 'true' : 'false' }, '${ storyPreset }' )`;
}

function getVisitorsByLocationSource( args: Partial< VisitorsByLocationStoryControls > ) {
	return `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<VisitorsByLocationRender
\tattributes={ {
\t\treportParams: ${ getDefaultQueryParamsSource( args ) },
\t} }
/>`;
}

function renderVisitorsByLocation( { withComparison, preset }: VisitorsByLocationStoryControls ) {
	return (
		<VisitorsByLocationRender
			attributes={ getVisitorsByLocationAttributes( withComparison, preset ) }
		/>
	);
}

function VisitorsByLocationDashboardStory( {
	withComparison,
	preset,
	...dashboardStoryArgs
}: VisitorsByLocationDashboardStoryProps ) {
	return (
		<GlobalErrorProvider>
			<WidgetDashboardWithWidgetStory
				{ ...dashboardStoryArgs }
				widgetType={ widgetDefinition }
				renderModule={ VISITORS_BY_LOCATION_RENDER_MODULE }
				renderComponent={
					VisitorsByLocationRender as ComponentType< WidgetRenderProps< unknown > >
				}
				attributes={ getVisitorsByLocationAttributes( withComparison, preset ) }
			/>
		</GlobalErrorProvider>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/VisitorsByLocation',
	component: VisitorsByLocationRender,
	tags: [ 'autodocs' ],
	argTypes: {
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "Visitors by location" widget. Fetches the visitors report and displays where store visitors are located geographically.',
			},
		},
	},
} satisfies Meta< VisitorsByLocationStoryProps >;

export default meta;

type Story = StoryObj< VisitorsByLocationStoryControls >;
type DashboardStory = StoryObj< VisitorsByLocationDashboardStoryProps >;

/**
 * Default state for the current report period.
 */
export const Default: Story = {
	render: renderVisitorsByLocation,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: false,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< VisitorsByLocationStoryControls > }
				) => getVisitorsByLocationSource( storyContext.args ),
			},
		},
	},
};

/**
 * Comparison period enabled for the same report period.
 */
export const WithComparison: Story = {
	render: renderVisitorsByLocation,
	args: {
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	decorators: [ withWidgetCanvas ],
	parameters: {
		docs: {
			source: {
				transform: (
					_source: string,
					storyContext: { args: Partial< VisitorsByLocationStoryControls > }
				) => getVisitorsByLocationSource( storyContext.args ),
			},
		},
	},
};

/**
 * Renders the widget through the shared dashboard harness.
 */
export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <VisitorsByLocationDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		preset: DEFAULT_PRESET,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		preset: {
			control: 'select',
			options: PRESET_OPTIONS,
			description: 'Date-range preset used to generate the widget report params.',
		},
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params.',
		},
	},
	parameters: {
		docs: {
			source: {
				code: `import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';

<WidgetDashboardWithWidget
\twidgetType={ widgetDefinition }
\trenderModule="storybook/visitors-by-location"
\trenderComponent={ VisitorsByLocationRender }
\tattributes={ {
\t\treportParams: getDefaultQueryParams( true ),
\t} }
/>`,
			},
		},
	},
};
