import { AbbreviatedValue } from '../abbreviated-value';

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/AbbreviatedValue',
	component: AbbreviatedValue,
	tags: [ 'autodocs' ],
};

export default meta;

/**
 * Hover the compact figure to see the exact one.
 */
export const Compact = {
	args: {
		value: 18432,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
	},
};

/**
 * Nothing was shortened, so there is no tooltip.
 */
export const Plain = {
	args: {
		value: 432,
		dataFormat: { type: 'number', options: { useMultipliers: true } },
	},
};

/**
 * The compact rule across magnitudes: full below 1,000, one decimal while the
 * mantissa has two digits, none from three.
 */
export const Scale = {
	render: () => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '8px' } }>
			{ [ 999, 1234, 54321, 99950, 234567, 1234567, 123456789 ].map( value => (
				<AbbreviatedValue
					key={ value }
					value={ value }
					dataFormat={ { type: 'number', options: { useMultipliers: true } } }
				/>
			) ) }
		</div>
	),
};
