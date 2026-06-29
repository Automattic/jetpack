/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { FileDownloadsLeaderboard, type FileDownloadRow } from '../render';
import FileDownloadsRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const FILE_DOWNLOADS_RENDER_MODULE = 'storybook/file-downloads';

const storyWidgetType = {
	name: widgetDefinition.name,
	title: widgetDefinition.title,
	icon: widgetDefinition.icon,
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

const mockRows: FileDownloadRow[] = [
	{
		label: 'annual-report-2025.pdf',
		value: 3840,
		previousValue: 3200,
		href: 'https://example.com/annual-report-2025.pdf',
	},
	{
		label: 'product-brochure.pdf',
		value: 2610,
		previousValue: 2900,
		href: 'https://example.com/product-brochure.pdf',
	},
	{
		label: 'getting-started-guide.pdf',
		value: 1920,
		previousValue: 1600,
		href: 'https://example.com/getting-started-guide.pdf',
	},
	{
		label: 'press-release-q1.docx',
		value: 1305,
		previousValue: 1500,
		href: 'https://example.com/press-release-q1.docx',
	},
	{
		label: 'logo-assets.zip',
		value: 870,
		previousValue: 700,
		href: 'https://example.com/logo-assets.zip',
	},
	{
		label: 'terms-of-service.pdf',
		value: 540,
		href: 'https://example.com/terms-of-service.pdf',
	},
	{
		label: 'changelog.txt',
		value: 290,
		href: 'https://example.com/changelog.txt',
	},
];

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
} satisfies Meta< FileDownloadsStoryControls >;

export default meta;

type Story = StoryObj< FileDownloadsStoryControls >;
type PresentationalStory = StoryObj< typeof FileDownloadsLeaderboard >;
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
	parameters: {
		docs: {
			description: {
				story:
					'File downloads renders previous-period deltas when comparison report params are present, matching the comparison behavior of the other Premium Analytics leaderboard widgets.',
			},
		},
	},
};

export const LoadingState: PresentationalStory = {
	render: () => <FileDownloadsLeaderboard isLoading={ true } />,
	decorators: [ withWidgetCanvas ],
};

export const ErrorState: PresentationalStory = {
	render: () => <FileDownloadsLeaderboard isError={ true } />,
	decorators: [ withWidgetCanvas ],
};

export const EmptyState: PresentationalStory = {
	render: () => <FileDownloadsLeaderboard rows={ [] } />,
	decorators: [ withChartTheme, withWidgetCanvas ],
};

export const WithMockRows: PresentationalStory = {
	render: () => <FileDownloadsLeaderboard rows={ mockRows } />,
	decorators: [ withChartTheme, withWidgetCanvas ],
};

export const WithMockComparisonRows: PresentationalStory = {
	render: () => <FileDownloadsLeaderboard rows={ mockRows } withComparison={ true } />,
	decorators: [ withChartTheme, withWidgetCanvas ],
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
