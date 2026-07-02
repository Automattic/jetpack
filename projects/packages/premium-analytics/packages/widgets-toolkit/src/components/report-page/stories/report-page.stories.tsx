/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { Text } from '@wordpress/ui';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { ReportPageLayout } from '../report-page-layout';
import { ReportPerformanceChart } from '../report-performance-chart';
import { ReportRecordsTable } from '../report-records-table';
import type { IntervalType, StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';
import type { Meta, StoryObj } from '@storybook/react';
import type { Field } from '@wordpress/dataviews';

/**
 * Build a deterministic 30-day visits report fixture. `offsetDays` shifts the
 * window back (for the comparison period) and `scale` shrinks the values so
 * the two periods read as distinct series.
 *
 * @param offsetDays - Days to shift the window into the past.
 * @param scale      - Multiplier applied to every metric.
 * @return The time-series report.
 */
function buildVisitsReport( offsetDays = 0, scale = 1 ): StatsTimeSeriesReport {
	const start = new Date( '2026-06-03T00:00:00Z' );
	start.setUTCDate( start.getUTCDate() - offsetDays );

	const data = Array.from( { length: 30 }, ( _, index ) => {
		const day = new Date( start );
		day.setUTCDate( day.getUTCDate() + index );
		const date = day.toISOString().slice( 0, 10 );
		// A weekly wave so the lines look like the product, not noise.
		const wave = Math.sin( ( index / 7 ) * Math.PI * 2 );

		return {
			time_interval: date,
			date_start: date,
			date_end: date,
			label: date,
			items: [],
			value: Math.round( ( 1600 + 200 * wave ) * scale ),
			views: Math.round( ( 1600 + 200 * wave ) * scale ),
			visitors: Math.round( ( 650 + 130 * wave ) * scale ),
			comments: Math.round( ( 4 + 3 * wave ) * scale ),
			likes: Math.round( ( 7 + 4 * wave ) * scale ),
		};
	} );

	const sum = ( key: 'views' | 'visitors' | 'comments' | 'likes' ) =>
		data.reduce( ( total, point ) => total + point[ key ], 0 );

	return {
		summary: {
			date_start: data[ 0 ].date_start,
			date_end: data[ data.length - 1 ].date_end,
			views: sum( 'views' ),
			visitors: sum( 'visitors' ),
			comments: sum( 'comments' ),
			likes: sum( 'likes' ),
		},
		data,
	};
}

const PRIMARY_REPORT = buildVisitsReport();
const COMPARISON_REPORT = buildVisitsReport( 30, 0.8 );

type PostRow = {
	id: string;
	title: string;
	views: number;
};

const POSTS: PostRow[] = [
	{ id: '1', title: 'Hello world!', views: 172 },
	{ id: '2', title: 'The Ultimate Guide to SEO in 2025', views: 127 },
	{ id: '3', title: '10 Tips for Better Product Photography', views: 97 },
	{ id: '4', title: 'Why Remote Work Is Here to Stay', views: 74 },
	{ id: '5', title: "A Beginner's Guide to Email Marketing", views: 55 },
	{ id: '6', title: 'Understanding Web Performance Metrics', views: 38 },
	{ id: '7', title: "Design Trends You Can't Ignore", views: 29 },
	{ id: '8', title: 'How We Grew Traffic by 300%', views: 26 },
	{ id: '9', title: 'The Complete Guide to Static Sites', views: 21 },
	{ id: '10', title: 'Our Favorite Development Tools', views: 18 },
	{ id: '11', title: 'A Year in Review', views: 12 },
	{ id: '12', title: 'Meet the Team', views: 9 },
];

const POST_FIELDS: Field< PostRow >[] = [
	{
		id: 'title',
		label: 'Title',
		enableGlobalSearch: true,
		enableHiding: false,
		getValue: ( { item } ) => item.title,
	},
	{
		id: 'views',
		label: 'Views',
		getValue: ( { item } ) => item.views,
	},
];

interface ReportPageStoryControls {
	withComparison: boolean;
	isLoading: boolean;
}

/**
 * The full second-level report page as PR 2 will compose it: breadcrumb header
 * with a Download action slot, the filters row (placeholder here — the real
 * page passes `DateFiltersPanel`), the multi-metric performance chart, and the
 * Core DataViews records table.
 *
 * @param {ReportPageStoryControls} props - The story controls.
 * @return The composed report page.
 */
function ComposedReportPage( { withComparison, isLoading }: ReportPageStoryControls ) {
	const [ interval, setInterval ] = useState< IntervalType >( 'day' );

	return (
		<ReportPageLayout
			breadcrumbs={ <Text variant="heading-md">Stats / Pages</Text> }
			description="All your posts and archive pages."
			actions={ <Button variant="secondary">Download</Button> }
			filters={
				<>
					<Button variant="secondary">Last 30 days: Jun 3 – Jul 2, 2026</Button>
					<Button variant="secondary">Compare to: May 4 – Jun 2, 2026</Button>
				</>
			}
		>
			<ReportPerformanceChart
				primary={ PRIMARY_REPORT }
				comparison={ withComparison ? COMPARISON_REPORT : undefined }
				isLoading={ isLoading }
				interval={ interval }
				onIntervalChange={ setInterval }
			/>
			<ReportRecordsTable
				data={ POSTS }
				fields={ POST_FIELDS }
				getItemId={ ( item: PostRow ) => item.id }
				isLoading={ isLoading }
				initialView={ { sort: { field: 'views', direction: 'desc' } } }
				searchLabel="Search posts"
			/>
		</ReportPageLayout>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ReportPage',
	component: ReportPageLayout,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
		isLoading: { control: 'boolean' },
	},
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'The shared report-page framework: `ReportPageLayout` (breadcrumb header, actions, tabs, filters slots), `ReportPerformanceChart` (multi-metric visits chart with metric show/hide and interval control), and `ReportRecordsTable` (Core DataViews table with client-side search/sort/pagination). Module report pages compose these with their own data hook and field config.',
			},
		},
	},
} satisfies Meta< ReportPageStoryControls >;

export default meta;

type Story = StoryObj< ReportPageStoryControls >;

/**
 * The composed page. Note the comparison overlay only draws when a single
 * metric is visible (hide the others via the chart's ⋮ menu) — with several
 * metrics shown, dashed twins per metric would make the chart unreadable.
 */
export const Default: Story = {
	render: args => <ComposedReportPage { ...args } />,
	args: { withComparison: true, isLoading: false },
};

/**
 * The loading overlays on both sections while data resolves.
 */
export const Loading: Story = {
	render: args => <ComposedReportPage { ...args } />,
	args: { withComparison: false, isLoading: true },
};
