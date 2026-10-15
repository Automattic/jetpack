/**
 * External dependencies
 */
import { computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { Text, type Field } from '@jetpack-premium-analytics/externals';
import '@wordpress/dataviews/build-style/style.css';
import { Button } from '@wordpress/components';
import { Icon, external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { FIXTURE_SITE_TIME_ZONE } from '../../../__fixtures__/wp-date-settings';
import { applyFixtureSiteSettings } from '../../../stories/fixture-site';
import { ReportEmptyState } from '../report-empty-state';
import { ReportPageLayout } from '../report-page-layout';
import { ReportPageShell } from '../report-page-shell';
import { ReportRecordsTable } from '../report-records-table';
import styles from './report-page.stories.module.scss';
import type { ReportDateFilters } from '@jetpack-premium-analytics/routing';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

applyFixtureSiteSettings();

type PostRow = {
	id: string;
	title: string;
	link?: string;
	isExternal?: boolean;
	views: number;
};

const POSTS: PostRow[] = [
	{ id: '1', title: 'Hello world!', link: '#/post/1', views: 172 },
	{
		id: '2',
		title: 'The Ultimate Guide to SEO in 2025',
		link: 'https://example.com/seo-guide',
		isExternal: true,
		views: 127,
	},
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
	isLoading: boolean;
	isEmpty?: boolean;
}

/**
 * Stand-in for `Breadcrumbs`, which renders router links Storybook has no
 * router for. The trailing crumb is the page's `h1`.
 *
 * @return The breadcrumb stand-in.
 */
function StoryBreadcrumbs() {
	return (
		<Text variant="heading-lg" render={ <h1 /> }>
			Stats / Pages
		</Text>
	);
}

const STORY_TIMEZONE = FIXTURE_SITE_TIME_ZONE;
const STORY_RANGE = computePrimaryRange( 'last-30-days', STORY_TIMEZONE );

// Stand-in for `useReportDateFilters`, which needs a mounted router. Inert:
// the picker's own behaviour is covered by its story.

const STORY_DATE_FILTERS: ReportDateFilters = {
	presetId: 'last-30-days',
	range: { from: STORY_RANGE?.from, to: STORY_RANGE?.to },
	appliedPresetId: 'last-30-days',
	appliedRange: { from: STORY_RANGE?.from, to: STORY_RANGE?.to },
	interval: 'day',
	intervalOptions: [ 'day' ],
	onChange: () => {},
	onComparisonChange: () => {},
	onIntervalChange: () => {},
	onApply: () => {},
	onCancel: () => {},
	canApply: false,
	timeZone: STORY_TIMEZONE,
	replaceRange: () => {},
};

/**
 * The full second-level report page: shell header, section header and records
 * table.
 *
 * @param {ReportPageStoryControls} props - The story controls.
 * @return The composed report page.
 */
function ComposedReportPage( { isLoading, isEmpty }: ReportPageStoryControls ) {
	return (
		<ReportPageShell
			breadcrumbs={ <StoryBreadcrumbs /> }
			actions={ <Button variant="secondary">Download</Button> }
		>
			<ReportPageLayout title="Posts & Pages" dateFilters={ STORY_DATE_FILTERS }>
				{ isEmpty ? (
					<ReportEmptyState />
				) : (
					<ReportRecordsTable
						data={ POSTS }
						fields={ POST_FIELDS }
						getItemId={ ( item: PostRow ) => item.id }
						isLoading={ isLoading }
						initialView={ {
							sort: { field: 'views', direction: 'desc' },
							titleField: 'title',
							fields: [ 'views' ],
						} }
						searchLabel="Search posts"
						isItemClickable={ ( item: PostRow ) => Boolean( item.link ) }
						renderItemLink={ ( { item, className, children, ...linkProps } ) => (
							<a
								{ ...linkProps }
								className={ [ className, item.isExternal ? styles.externalLink : '' ]
									.filter( Boolean )
									.join( ' ' ) }
								href={ item.link }
								target={ item.isExternal ? '_blank' : undefined }
								rel={ item.isExternal ? 'noopener noreferrer' : undefined }
							>
								{ children }
								{ item.isExternal ? (
									<Icon className={ styles.externalIcon } icon={ external } size={ 16 } />
								) : null }
							</a>
						) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ReportPage',
	component: ReportPageLayout,
	tags: [ 'autodocs' ],
	argTypes: {
		isLoading: { control: 'boolean' },
		isEmpty: { control: 'boolean' },
	},
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'The shared report-page framework: `ReportPageShell` (the page header — breadcrumbs and actions), `ReportPageLayout` (optional tabs, the `SectionHeader` carrying the report title and its date controls, and the stacked sections), `ReportChartSection` (a chart card with the control below it that collapses it, and the optional heading, icon and info tip a chart names itself with — shared by every chart above a records table), and `ReportRecordsTable` (Core DataViews table with client-side search/sort/pagination). Module report pages compose these with their own data hook and field config.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof ReportPageLayout > & ReportPageStoryControls >;

export default meta;

type Story = StoryObj< ReportPageStoryControls >;

/**
 * The composed page.
 */
export const Default: Story = {
	render: args => <ComposedReportPage { ...args } />,
	args: { isLoading: false },
};

/**
 * The records table's loading state while data resolves.
 */
export const Loading: Story = {
	render: args => <ComposedReportPage { ...args } />,
	args: { isLoading: true },
};

/**
 * The selected period returned no rows, so the empty state replaces the
 * records table.
 */
export const EmptyPeriod: Story = {
	render: args => <ComposedReportPage { ...args } />,
	args: { isLoading: false, isEmpty: true },
};
