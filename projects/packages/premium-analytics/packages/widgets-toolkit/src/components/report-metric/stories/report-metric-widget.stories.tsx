import { withWidgetRoot } from '../../../stories/with-widget-root';
import { ReportMetricWidget } from '../report-metric';
import type { ReportMetricWidgetProps } from '../report-metric';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Helper to format date string with offset days
 */
const formatDateString = ( startDate: Date, offsetDays: number ): string => {
	const date = new Date( startDate );
	date.setDate( date.getDate() + offsetDays );
	return date.toISOString().split( 'T' )[ 0 ];
};

/**
 * Multipliers for generating daily data points with visible variation
 */
const DATA_MULTIPLIERS = [ 0.85, 1.1, 0.95, 1.2, 0.9, 1.05, 0.95 ];

/**
 * Mock report data matching the ReportData type
 */
const createMockReportData = (
	metricKey: string,
	baseValue: number,
	dateRange: { start: string; end: string } = {
		start: '2024-01-01',
		end: '2024-01-07',
	}
) => {
	const startDate = new Date( dateRange.start );

	return {
		summary: {
			date_start: dateRange.start,
			date_end: dateRange.end,
			[ metricKey ]: baseValue,
		},
		data: DATA_MULTIPLIERS.map( ( multiplier, index ) => ( {
			date_start: formatDateString( startDate, index ),
			[ metricKey ]: baseValue * multiplier,
		} ) ),
	};
};

/**
 * Date ranges for mock data - primary is current week, comparison is previous week
 */
const PRIMARY_DATE_RANGE = { start: '2024-01-08', end: '2024-01-14' };
const COMPARISON_DATE_RANGE = { start: '2024-01-01', end: '2024-01-07' };

/**
 * Create mock data for ReportHookResult with configurable states
 */
const createMockData = ( options: {
	metricKey: string;
	primaryValue: number;
	comparisonValue?: number;
	isLoading?: boolean;
	isFetching?: boolean;
	hasData?: boolean;
	includeData?: boolean;
} ): ReportMetricWidgetProps[ 'data' ] => {
	const {
		metricKey,
		primaryValue,
		comparisonValue,
		isLoading = false,
		isFetching = false,
		hasData = true,
		includeData = true,
	} = options;

	return {
		primary: {
			data: includeData
				? createMockReportData( metricKey, primaryValue, PRIMARY_DATE_RANGE )
				: undefined,
		},
		comparison: {
			data:
				comparisonValue !== undefined
					? createMockReportData( metricKey, comparisonValue, COMPARISON_DATE_RANGE )
					: undefined,
		},
		isLoading,
		isFetching,
		hasData,
		isError: false,
		error: null,
		refetch: () => Promise.resolve(),
	};
};

const meta: Meta< typeof ReportMetricWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ReportMetricWidget',
	component: ReportMetricWidget,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Internal component that displays a metric with time series chart and optional comparison period.',
			},
		},
	},
	decorators: [ withWidgetRoot() ],
};

export default meta;

type Story = StoryObj< typeof ReportMetricWidget >;

/**
 * Loading state - shows initial loading skeleton overlay
 * Triggered when `isLoading: true` and `hasData: false`
 */
export const Loading: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 0,
			isLoading: true,
			hasData: false,
			includeData: false,
		} ),
		dataFormat: { type: 'currency' },
	},
};

/**
 * Updating state - shows spinner overlay while refetching
 * Triggered when `isLoading: true` (or `isFetching: true`) and `hasData: true`
 */
export const Updating: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 45678.99,
			isLoading: true,
			hasData: true,
		} ),
		dataFormat: { type: 'currency' },
	},
};

/**
 * Empty state - component returns null when no data and not loading
 * This story demonstrates the empty state behavior
 */
export const Empty: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 0,
			isLoading: false,
			hasData: false,
			includeData: false,
		} ),
		dataFormat: { type: 'currency' },
	},
	parameters: {
		docs: {
			description: {
				story:
					'When there is no data and loading is complete, the component renders nothing (returns null).',
			},
		},
	},
};

/**
 * Number format - displays plain numbers (e.g., order count)
 */
export const NumberFormat: Story = {
	args: {
		metricKey: 'orders_no',
		data: createMockData( {
			metricKey: 'orders_no',
			primaryValue: 1234,
		} ),
		dataFormat: { type: 'number' },
	},
};

/**
 * Currency format with multipliers - uses abbreviations like "45.7K"
 */
export const CurrencyCompact: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 1234567.89,
		} ),
		dataFormat: {
			type: 'currency',
			options: { useMultipliers: true, decimals: 1 },
		},
	},
};

/**
 * Percentage format - displays percentage values
 */
export const PercentageFormat: Story = {
	args: {
		metricKey: 'conversion_rate',
		data: createMockData( {
			metricKey: 'conversion_rate',
			primaryValue: 0.342,
		} ),
		dataFormat: {
			type: 'percentage',
			options: { decimals: 1 },
		},
	},
};

/**
 * With comparison period - shows delta between current and previous period
 */
export const WithComparison: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 45678.99,
			comparisonValue: 38500.0,
		} ),
		dataFormat: { type: 'currency' },
	},
};

/**
 * Without comparison - shows only the current period value
 */
export const WithoutComparison: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 45678.99,
		} ),
		dataFormat: { type: 'currency' },
	},
};

/**
 * Negative delta - comparison shows decrease from previous period
 */
export const NegativeDelta: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 35000.0,
			comparisonValue: 45678.99,
		} ),
		dataFormat: { type: 'currency' },
	},
};

/**
 * Positive delta - comparison shows increase from previous period
 */
export const PositiveDelta: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 45678.99,
			comparisonValue: 38500.0,
		} ),
		dataFormat: { type: 'currency' },
	},
};

/**
 * Large values - tests formatting with very large numbers
 */
export const LargeValues: Story = {
	args: {
		metricKey: 'total_sales',
		data: createMockData( {
			metricKey: 'total_sales',
			primaryValue: 9876543.21,
			comparisonValue: 7654321.0,
		} ),
		dataFormat: {
			type: 'currency',
			options: { useMultipliers: true, decimals: 1 },
		},
	},
};
