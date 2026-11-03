/**
 * External dependencies
 */
import { customer } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { Columns, type ColumnsProps } from '../columns';
import type { ColumnInput } from '../build-columns-chart-data';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const COLUMNS: ColumnInput[] = [
	{ label: 'Returning', value: 3820, previousValue: 3000 },
	{ label: 'New', value: 1210, previousValue: 1400 },
];

const CURRENCY = { type: 'currency' as const, options: { useMultipliers: true } };

const READY = { isLoading: false, isError: false };

const withCard: Decorator = Story => (
	<WidgetCard height="360px">
		<Story />
	</WidgetCard>
);

const meta: Meta< typeof Columns > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/Columns',
	component: Columns,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The columns widget body: hand it the columns, as figures of the period and of the comparison period, and the request status, and it renders a vertical bar per column and per period, the periods named in the legend from the report params, and the loading, error and empty states. Renders inside `WidgetRoot`.',
			},
		},
	},
	decorators: [ withCard, withWidgetRoot() ],
	args: {
		columns: COLUMNS,
		status: READY,
		format: CURRENCY,
	},
};

export default meta;

type Story = StoryObj< ColumnsProps >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: { status: { ...READY, hasComparison: true } },
};

export const FourColumns: Story = {
	args: {
		columns: [
			{ label: 'SAVE10', value: 4200, previousValue: 3900 },
			{ label: 'WELCOME', value: 2650, previousValue: 1800 },
			{ label: 'VIP20', value: 1300, previousValue: 1500 },
			{ label: 'Other', value: 820, previousValue: 640 },
		],
		status: { ...READY, hasComparison: true },
	},
};

export const Loading: Story = {
	args: { status: { isLoading: true } },
};

export const Failed: Story = {
	args: { status: { isLoading: false, isError: true, refetch: () => undefined } },
};

export const Empty: Story = {
	args: {
		columns: [],
		empty: { icon: customer, description: 'No customer revenue in this period.' },
	},
};
