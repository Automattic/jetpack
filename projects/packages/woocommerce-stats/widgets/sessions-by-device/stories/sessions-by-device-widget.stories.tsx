import { expect, within } from 'storybook/test';
import {
	createStoryWidgetType,
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	forceWooReportState,
	registerWooReportMocks,
	storyReportParams,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	withWidgetCanvas,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/shared';
import SessionsByDeviceRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerWooReportMocks();

const SESSIONS_BY_DEVICE_RENDER_MODULE = 'storybook/sessions-by-device';
const SESSIONS_REPORT_PATH = 'analytics/reports/sessions/by-device';

const storyWidgetType = createStoryWidgetType( widgetManifest );

interface SessionsByDeviceStoryControls {
	withComparison: boolean;
}

interface SessionsByDeviceDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, SessionsByDeviceStoryControls {}

const storyControlArgTypes = {
	withComparison: {
		control: 'boolean',
		description: 'Include previous-period comparison report params.',
	},
} as const;

/**
 * Renders the widget close-up with the story controls as its attributes.
 *
 * @param controls                - The story controls.
 * @param controls.withComparison - Whether the report params carry a comparison window.
 * @return The widget.
 */
function renderSessionsByDeviceWidget( { withComparison }: SessionsByDeviceStoryControls ) {
	return (
		<SessionsByDeviceRender
			attributes={ { reportParams: storyReportParams( { withComparison } ) } }
		/>
	);
}

/**
 * Mounts the real widget dashboard around the widget, with the story controls as its attributes.
 *
 * @param props                - The dashboard controls plus the story controls.
 * @param props.withComparison - Whether the report params carry a comparison window.
 * @return The dashboard.
 */
function SessionsByDeviceDashboardStory( {
	withComparison,
	...dashboardArgs
}: SessionsByDeviceDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ SESSIONS_BY_DEVICE_RENDER_MODULE }
			renderComponent={ SessionsByDeviceRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: storyReportParams( { withComparison } ) } }
		/>
	);
}

const meta = {
	title: 'Packages/WooCommerce Stats/Widgets/SessionsByDevice',
	component: SessionsByDeviceRender,
	tags: [ 'autodocs' ],
	argTypes: storyControlArgTypes,
	parameters: {
		docs: {
			description: {
				component:
					'The "Sessions by device" widget. Splits the sessions of the period by device category as a half ring, with the total the report states under the arc and an optional previous-period comparison.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof SessionsByDeviceRender > & SessionsByDeviceStoryControls >;

export default meta;

type Story = StoryObj< SessionsByDeviceStoryControls >;
type DashboardStory = StoryObj< SessionsByDeviceDashboardStoryProps >;

/**
 * The report includes sessions with no device type, which the legend names "Unknown", and states
 * a total above the sum of its rows, as the real report can.
 */
export const Default: Story = {
	render: renderSessionsByDeviceWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );

		await expect( await canvas.findByText( 'Mobile' ) ).toBeVisible();
		await expect( await canvas.findByText( 'Unknown' ) ).toBeVisible();
	},
};

export const WithComparison: Story = {
	render: renderSessionsByDeviceWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const Loading: Story = {
	render: renderSessionsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( SESSIONS_REPORT_PATH, 'loading' ),
};

export const Empty: Story = {
	render: renderSessionsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( SESSIONS_REPORT_PATH, 'empty' ),
};

export const ErrorState: Story = {
	render: renderSessionsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( SESSIONS_REPORT_PATH, 'error' ),
};

export const ErrorRetryable: Story = {
	render: renderSessionsByDeviceWidget,
	args: { withComparison: false },
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: forceWooReportState( SESSIONS_REPORT_PATH, 'error-retryable' ),
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <SessionsByDeviceDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		...storyControlArgTypes,
	},
};
