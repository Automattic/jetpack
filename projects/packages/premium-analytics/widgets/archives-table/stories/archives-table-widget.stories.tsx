/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import { registerStatsMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-stats-mocks';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { withStoryRouter } from '../../stories/with-story-router';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import ArchivesTableRender from '../render';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();
registerStatsMocks();

const ARCHIVES_TABLE_RENDER_MODULE = 'storybook/archives-table';

interface ArchivesTableStoryControls {
	withComparison: boolean;
}

interface ArchivesTableDashboardStoryProps
	extends WidgetDashboardWithWidgetControls, ArchivesTableStoryControls {}

function renderArchivesTableWidget( { withComparison }: ArchivesTableStoryControls ) {
	return (
		<ArchivesTableRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

function ArchivesTableDashboardStory( {
	withComparison,
	...dashboardArgs
}: ArchivesTableDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest ) }
			renderModule={ ARCHIVES_TABLE_RENDER_MODULE }
			renderComponent={ ArchivesTableRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets/ArchivesTable',
	component: ArchivesTableRender,
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
					'The Archives table of the All pages report: every archive page of the period with its views, grouped by type in rows that unfold, searchable and sortable inside the tile.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ArchivesTableRender > & ArchivesTableStoryControls >;

export default meta;

type Story = StoryObj< ArchivesTableStoryControls >;
type DashboardStory = StoryObj< ArchivesTableDashboardStoryProps >;

export const Default: Story = {
	render: renderArchivesTableWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WithComparison: Story = {
	render: renderArchivesTableWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas, withStoryRouter ],
};

export const WidgetDashboardWithWidget: DashboardStory = {
	tags: [ 'widget-dashboard' ],
	render: args => <ArchivesTableDashboardStory { ...args } />,
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
