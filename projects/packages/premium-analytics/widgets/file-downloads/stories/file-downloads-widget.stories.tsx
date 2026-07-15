/**
 * External dependencies
 */
import { getDefaultQueryParams, type PresetType } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { forceStatsMockState } from '../../stories/force-stats-mock-state';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import FileDownloadsRender from '../render';
import widgetDefinition from '../widget';
import type { Meta, StoryObj } from '@storybook/react';
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

function renderFileDownloadsWidget( { withComparison }: FileDownloadsStoryControls ) {
	return (
		<FileDownloadsRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

// Distinct preset → own query-cache entry; see forceStatsMockState.
function renderFileDownloadsOnPreset( preset: PresetType ) {
	return (
		<FileDownloadsRender
			attributes={ { max: 10, reportParams: getDefaultQueryParams( false, preset ) } }
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

/**
 * First load: the fetch is in flight, so the widget shows its loading state. The
 * mock is forced to never resolve for the duration of this story.
 */
export const Loading: Story = {
	render: () => renderFileDownloadsOnPreset( 'last-90-days' ),
	// Off the shared autodocs page — path-keyed override; see forceStatsMockState.
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/file-downloads', 'loading' );
		return () => forceStatsMockState( 'stats/file-downloads', null );
	},
};

/**
 * The fetch failed: the widget shows its error state with a Retry action (which
 * re-runs the query — still mocked as failing while this story is active).
 */
export const Error: Story = {
	render: () => renderFileDownloadsOnPreset( 'last-7-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/file-downloads', 'error' );
		return () => forceStatsMockState( 'stats/file-downloads', null );
	},
};

/**
 * Resolved with no rows: the widget shows its empty state (the download glyph
 * and "No file downloads in this period.").
 */
export const Empty: Story = {
	render: () => renderFileDownloadsOnPreset( 'last-365-days' ),
	tags: [ '!autodocs' ],
	decorators: [ withWidgetCanvas ],
	beforeEach: () => {
		forceStatsMockState( 'stats/file-downloads', 'empty' );
		return () => forceStatsMockState( 'stats/file-downloads', null );
	},
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
