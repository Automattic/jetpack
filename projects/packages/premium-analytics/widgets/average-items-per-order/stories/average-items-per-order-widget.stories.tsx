import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AverageItemsPerOrderRender from '../render';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

registerReportMocks();

const meta: Meta< typeof AverageItemsPerOrderRender > = {
	title: 'Packages/Premium Analytics/Widgets/AverageItemsPerOrder',
	component: AverageItemsPerOrderRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays the average number of items per order with an optional comparison period and sparkline.',
			},
		},
	},
	decorators: [
		Story => (
			<div style={ { width: '100%', height: '300px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj< typeof AverageItemsPerOrderRender >;

const DASHBOARD_ROW_HEIGHT = 300;
const DASHBOARD_GRID_GAP = 24;
const DASHBOARD_DEFAULT_HEIGHT = `${ DASHBOARD_ROW_HEIGHT * 2 + DASHBOARD_GRID_GAP }px`;
const DASHBOARD_MIN_HEIGHT = `${ DASHBOARD_ROW_HEIGHT }px`;

export const Default: Story = {
	args: {
		attributes: {
			reportParams: getDefaultQueryParams(),
		},
	},
};

export const WithComparison: Story = {
	args: {
		attributes: {
			reportParams: getDefaultQueryParams( true ),
		},
	},
};

const createDashboardSizeDecorator = (
	width: string,
	height = DASHBOARD_DEFAULT_HEIGHT
): Decorator => {
	return Story => (
		<div
			style={ {
				width,
				height,
				boxSizing: 'border-box',
				border: '1px dashed #ccc',
				borderRadius: '8px',
				padding: '16px',
				background: '#fafafa',
				containerType: 'inline-size',
				containerName: 'widget',
			} }
		>
			<Story />
		</div>
	);
};

export const DesktopOneColumnDefault: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( '256px' ) ],
};

export const TwoColumnDashboardDefault: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( '448px' ) ],
};

export const SingleColumnDashboardDefault: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( '576px' ) ],
};

export const MinimumResizedTile: Story = {
	args: WithComparison.args,
	decorators: [ createDashboardSizeDecorator( '256px', DASHBOARD_MIN_HEIGHT ) ],
};
