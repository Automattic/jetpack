import { MetricWithComparison } from '../metric-with-comparison';

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricWithComparison',
	component: MetricWithComparison,
	tags: [ 'autodocs' ],
	argTypes: {
		value: {
			control: 'number',
			description: 'The current value to display',
		},
		previousValue: {
			control: 'number',
			description: 'The previous value for comparison',
		},
		direction: {
			control: 'select',
			options: [ 'row', 'column' ],
			description: 'Layout direction',
		},
		fontSize: {
			control: 'select',
			options: [ 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ],
			description: 'Font size token from WPDS',
		},
		invertDeltaColors: {
			control: 'boolean',
			description: 'Invert colors (for metrics like bounce rate)',
		},
		hideDeltaOnZero: {
			control: 'boolean',
			description: 'Hide delta when it is zero',
		},
		showAbsoluteDelta: {
			control: 'boolean',
			description: 'Show absolute change instead of percentage',
		},
	},
};

export default meta;

/**
 * Default display with value only (no comparison)
 */
export const Default = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
	},
};

/**
 * With comparison showing percentage delta
 */
export const WithComparison = {
	args: {
		value: 15000,
		previousValue: 12000,
		dataFormat: { type: 'number' },
	},
};

/**
 * Horizontal layout (default)
 */
export const RowLayout = {
	args: {
		value: 45678,
		previousValue: 40000,
		dataFormat: { type: 'number' },
		direction: 'row',
	},
};

/**
 * Vertical layout, commonly used in chart overlays
 */
export const ColumnLayout = {
	args: {
		value: 45678,
		previousValue: 40000,
		dataFormat: { type: 'number' },
		direction: 'column',
	},
};

/**
 * Extra large font size (default)
 */
export const ExtraLargeSize = {
	args: {
		value: 12345,
		previousValue: 10000,
		dataFormat: { type: 'number' },
		fontSize: 'xl',
	},
};

/**
 * Large font size
 */
export const LargeSize = {
	args: {
		value: 12345,
		previousValue: 10000,
		dataFormat: { type: 'number' },
		fontSize: 'lg',
	},
};

/**
 * Small font size
 */
export const SmallSize = {
	args: {
		value: 12345,
		previousValue: 10000,
		dataFormat: { type: 'number' },
		fontSize: 'sm',
	},
};

/**
 * Currency format with compact notation
 */
export const CurrencyFormat = {
	args: {
		value: 1234567,
		previousValue: 1000000,
		dataFormat: {
			type: 'currency',
			options: { useMultipliers: true, decimals: 1 },
		},
	},
};

/**
 * Percentage format
 */
export const PercentageFormat = {
	args: {
		value: 0.4523,
		previousValue: 0.38,
		dataFormat: {
			type: 'percentage',
			options: { decimals: 1 },
		},
	},
};

/**
 * Number format with decimals
 */
export const NumberFormat = {
	args: {
		value: 1234.56,
		previousValue: 1100.25,
		dataFormat: {
			type: 'number',
			options: { decimals: 2 },
		},
	},
};

/**
 * Inverted delta colors for metrics where decrease is good
 */
export const InvertedDeltaColors = {
	args: {
		value: 25,
		previousValue: 35,
		dataFormat: {
			type: 'percentage',
			options: { decimals: 1 },
		},
		invertDeltaColors: true,
	},
};

/**
 * Negative change (value decreased)
 */
export const NegativeChange = {
	args: {
		value: 8000,
		previousValue: 10000,
		dataFormat: { type: 'number' },
	},
};

/**
 * Zero change - delta hidden
 */
export const ZeroChangeHidden = {
	args: {
		value: 10000,
		previousValue: 10000,
		dataFormat: { type: 'number' },
		hideDeltaOnZero: true,
	},
};

/**
 * Show absolute delta instead of percentage
 */
export const AbsoluteDelta = {
	args: {
		value: 15000,
		previousValue: 12000,
		dataFormat: { type: 'currency' },
		showAbsoluteDelta: true,
	},
};

/**
 * Column layout with currency - typical chart overlay
 */
export const ChartOverlayStyle = {
	args: {
		value: 1234567,
		previousValue: 1000000,
		dataFormat: {
			type: 'currency',
			options: { useMultipliers: true, decimals: 1 },
		},
		direction: 'column',
		fontSize: 'xl',
	},
};
