/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import FileDownloadsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const FILE_DOWNLOADS_RENDER_MODULE = 'storybook/file-downloads';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
	presentation: 'framed' as const,
};

interface FileDownloadsStoryControls {
	withComparison: boolean;
}

interface FileDownloadsDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		FileDownloadsStoryControls {}

const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '340px' } }>
		<Story />
	</div>
);

function renderFileDownloadsWidget( { withComparison }: FileDownloadsStoryControls ) {
	return (
		<FileDownloadsRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

function FileDownloadsDashboardStory( {
	withComparison,
	...dashboardArgs
}: FileDownloadsDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ storyWidgetType }
			renderModule={ FILE_DOWNLOADS_RENDER_MODULE }
			renderComponent={ FileDownloadsRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/FileDownloads',
	component: FileDownloadsRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'The "File downloads" widget. Shows the most-downloaded files as a ranked leaderboard, using the global dashboard date range. Each row links to the file URL when available.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof FileDownloadsRender > & FileDownloadsStoryControls >;

export default meta;

type Story = StoryObj< FileDownloadsStoryControls >;
type DashboardStory = StoryObj< FileDownloadsDashboardStoryProps >;

export const Default: Story = {
	render: renderFileDownloadsWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderFileDownloadsWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	render: args => <FileDownloadsDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: {
			control: 'boolean',
			description: 'Include previous-period comparison report params and deltas.',
		},
	},
};
