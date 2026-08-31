import { MetricDelta } from '../metric-delta';

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricDelta',
	component: MetricDelta,
	tags: [ 'autodocs' ],
	argTypes: {
		current: {
			control: 'number',
			description: 'The current/new value',
		},
		previous: {
			control: 'number',
			description: 'The previous/comparison value',
		},
		invertColors: {
			control: 'boolean',
			description: 'For metrics where decrease is improvement (e.g., bounce rate)',
		},
		hideZero: {
			control: 'boolean',
			description: 'Whether to hide when delta is zero',
		},
		showAbsolute: {
			control: 'boolean',
			description: 'Show absolute change instead of percentage',
		},
		absoluteFormat: {
			control: 'select',
			options: [ 'number', 'currency' ],
			description: 'Format for absolute values',
		},
		fallback: {
			control: 'text',
			description: 'What to display when calculation is not possible',
		},
	},
};

export default meta;

/**
 * Positive change (green, increase)
 */
export const Positive = {
	args: {
		current: 150,
		previous: 100,
	},
};

/**
 * Negative change (red, decrease)
 */
export const Negative = {
	args: {
		current: 80,
		previous: 100,
	},
};

/**
 * Zero change (neutral)
 */
export const Zero = {
	args: {
		current: 100,
		previous: 100,
	},
};

/**
 * Inverted colors for metrics where decrease is good (e.g., bounce rate, returns)
 * Here a decrease shows as green (positive)
 */
export const InvertedColorsDecrease = {
	args: {
		current: 80,
		previous: 100,
		invertColors: true,
	},
};

/**
 * Inverted colors: increase shows as red (negative)
 */
export const InvertedColorsIncrease = {
	args: {
		current: 120,
		previous: 100,
		invertColors: true,
	},
};

/**
 * Large percentage change (1000%+)
 */
export const LargeChange = {
	args: {
		current: 1100,
		previous: 100,
	},
};

/**
 * Small percentage change (< 1%)
 */
export const SmallChange = {
	args: {
		current: 100.5,
		previous: 100,
	},
};

/**
 * Fallback when previous value is zero (can't calculate percentage)
 */
export const FallbackZeroPrevious = {
	args: {
		current: 100,
		previous: 0,
		fallback: 'N/A',
	},
};

/**
 * Hide when delta is zero
 */
export const HideZero = {
	args: {
		current: 100,
		previous: 100,
		hideZero: true,
	},
};

/**
 * Show absolute change instead of percentage
 */
export const AbsoluteChange = {
	args: {
		current: 150,
		previous: 100,
		showAbsolute: true,
	},
};

/**
 * Show absolute change with currency format
 */
export const AbsoluteChangeCurrency = {
	args: {
		current: 1500,
		previous: 1000,
		showAbsolute: true,
		absoluteFormat: 'currency',
	},
};

/**
 * Negative absolute change
 */
export const AbsoluteChangeNegative = {
	args: {
		current: 800,
		previous: 1000,
		showAbsolute: true,
		absoluteFormat: 'currency',
	},
};

/**
 * Fallback with justify="flex-end" - tests alignment of dash character.
 * Used in legend rows where the dash should align right with percentage values.
 */
export const FallbackJustifyEnd = {
	args: {
		current: 100,
		previous: 0,
		fallback: '—',
		justify: 'flex-end',
	},
	decorators: [
		( Story: React.ComponentType ) => (
			<div style={ { width: 100, border: '1px dashed #ccc' } }>
				<Story />
			</div>
		),
	],
};
