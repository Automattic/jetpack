import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { VisitorsByLocationWidget } from '../visitors-by-location-widget';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof VisitorsByLocationWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Widgets/VisitorsByLocation',
	component: VisitorsByLocationWidget,
	tags: [ 'autodocs' ],
};

export default meta;

type Story = StoryObj< typeof VisitorsByLocationWidget >;

/**
 * Default state with mock data (no comparison)
 */
export const Default: Story = {
	decorators: [ withWidgetRoot( getDefaultQueryParams() ) ],
};

/**
 * With comparison period enabled
 */
export const WithComparison: Story = {
	decorators: [ withWidgetRoot( getDefaultQueryParams( true ) ) ],
};

/**
 * Simulate a narrow single-column dashboard tile: the map is hidden and only
 * the leaderboard is shown.
 */
export const SingleColumnTile: Story = {
	decorators: [
		withWidgetRoot( getDefaultQueryParams() ),
		Story => (
			<div
				role="button"
				aria-roledescription="sortable"
				style={ {
					gridColumnEnd: 'span 1',
					width: '400px',
					height: '300px',
				} }
			>
				<Story />
			</div>
		),
	],
};

/**
 * Simulate being rendered inside the 'Add widget' DataViews picker grid: the
 * narrow tile hides the map and shows only the leaderboard.
 */
export const WidgetPickerGrid: Story = {
	decorators: [
		withWidgetRoot( getDefaultQueryParams() ),
		Story => (
			<div className="dataviews-view-picker-grid" style={ { width: '300px', height: '250px' } }>
				<Story />
			</div>
		),
	],
};
