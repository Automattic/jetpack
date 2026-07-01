import { MetricValue } from '../metric-value';

const currencyCodes = [ 'USD', 'EUR', 'GBP', 'JPY', 'INR', 'BRL' ];

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricValue',
	component: MetricValue,
	tags: [ 'autodocs' ],
	argTypes: {
		fontSize: {
			control: 'select',
			options: [ 'xs', 'sm', 'md', 'lg', 'xl', '2xl' ],
		},
		color: {
			control: 'select',
			options: [ 'neutral', 'positive', 'negative' ],
		},
	},
};

export default meta;

/**
 * Format value as a number
 */
export const Number = {
	args: {
		value: 1234567,
		dataFormat: { type: 'number' },
	},
};

/**
 * Format value with decimal precision
 */
export const NumberWithDecimals = {
	args: {
		value: 1234.56,
		dataFormat: {
			type: 'number',
			options: { decimals: 2 },
		},
	},
};

/**
 * Format currency with compact notation (K, M, B) across different locales
 */
export const CurrencyCompact = {
	render: () => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
			{ currencyCodes.map( code => (
				<div
					key={ code }
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '16px',
					} }
				>
					<span style={ { width: '80px', fontWeight: 'bold' } }>{ code }:</span>
					<MetricValue
						value={ 4567899.99 }
						dataFormat={ {
							type: 'currency',
							options: { useMultipliers: true, decimals: 1 },
						} }
						currencyCode={ code }
					/>
				</div>
			) ) }
		</div>
	),
};

/**
 * Multiple currency formats showing different locales and symbol positions
 */
export const Currencies = {
	render: () => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
			{ currencyCodes.map( code => (
				<div
					key={ code }
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '16px',
					} }
				>
					<span style={ { width: '80px', fontWeight: 'bold' } }>{ code }:</span>
					<MetricValue
						value={ 45678.99 }
						dataFormat={ { type: 'currency' } }
						currencyCode={ code }
					/>
				</div>
			) ) }
		</div>
	),
};

/**
 * Format value as an average
 */
export const Average = {
	args: {
		value: 87.45,
		dataFormat: {
			type: 'average',
			options: { decimals: 2 },
		},
	},
};

/**
 * Format value as a percentage
 */
export const Percentage = {
	args: {
		value: 0.2345,
		dataFormat: {
			type: 'percentage',
			options: { decimals: 2 },
		},
	},
};

/**
 * Format negative percentage value
 */
export const PercentageNegative = {
	args: {
		value: -0.15,
		dataFormat: {
			type: 'percentage',
			options: { decimals: 1 },
		},
	},
};

/**
 * Small font size
 */
export const SmallSize = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
		fontSize: 'sm',
	},
};

/**
 * Large font size (default)
 */
export const LargeSize = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
		fontSize: 'lg',
	},
};

/**
 * Extra large font size
 */
export const ExtraLargeSize = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
		fontSize: 'xl',
	},
};

/**
 * Green color for positive values
 */
export const PositiveColor = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
		color: 'positive',
	},
};

/**
 * Red color for negative values
 */
export const NegativeColor = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
		color: 'negative',
	},
};

/**
 * Neutral color (default)
 */
export const NeutralColor = {
	args: {
		value: 12345,
		dataFormat: { type: 'number' },
		color: 'neutral',
	},
};
