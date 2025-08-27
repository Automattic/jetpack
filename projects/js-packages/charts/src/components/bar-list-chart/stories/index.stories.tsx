import { formatNumberCompact } from '@automattic/number-formatters';
import { Circle } from '@visx/shape';
import { Text } from '@visx/text';
import { sharedDecorator } from '../../../stories/decorator-config';
import {
	marketingChannelsData as salesByChannel,
	salesByProduct,
} from '../../../stories/sample-data';
import BarListChart from '../bar-list-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof BarListChart > & {
	containerWidth?: string;
	containerHeight?: string;
};

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Bar List Chart',
	component: BarListChart,
	parameters: {
		layout: 'centered',
	},
	decorators: sharedDecorator,
};

export default meta;

type Story = StoryObj< StoryArgs >;

// Default story with multiple series
export const Default: Story = {
	args: {
		withTooltips: true,
		data: salesByProduct,
		containerWidth: '600px',
		containerHeight: '332px',
	},
};

export const MultiSeries: Story = {
	args: {
		...Default.args,
		data: salesByChannel,
	},
};

export const CustomLabelComponent: Story = {
	args: {
		...Default.args,
		data: salesByProduct,
		width: 450,
		margin: {
			top: 0,
			right: 100,
			bottom: 0,
			left: 0,
		},
		options: {
			xScale: {},
			yScale: {},
			labelComponent: ( { textProps, x, y, label, formatter } ) => {
				return (
					<>
						<Circle cx={ x + 6 } cy={ y } r={ 8 } fill="#3858E9" />
						<Text { ...textProps } textAnchor="start" x={ x + 24 } y={ y } fontWeight={ 500 }>
							{ formatter( label ) }
						</Text>
					</>
				);
			},
		},
	},
};

export const CustomValueComponent: Story = {
	args: {
		...Default.args,
		data: salesByChannel,
		width: 450,
		margin: {
			top: 0,
			right: 100,
			bottom: 0,
			left: 0,
		},
		options: {
			xScale: {},
			yScale: {},
			valueComponent: ( { textProps, x, y, value, formatter, data, index } ) => {
				const currentValue = data[ 0 ].data[ index ].value;
				const previousValue = data[ 1 ].data[ index ].value;
				const percentage =
					previousValue === 0
						? 0
						: ( ( ( currentValue - previousValue ) / previousValue ) * 100 ).toFixed( 0 );

				return (
					<>
						<Text { ...textProps } textAnchor="end" x={ x } y={ y } dx={ -50 } fontWeight={ 500 }>
							{ formatter( value ) }
						</Text>
						<Text
							{ ...textProps }
							textAnchor="end"
							x={ x }
							y={ y }
							dx={ -10 }
							fill="#008A20"
							fontWeight={ 500 }
						>
							{ `${ Number( percentage ) > 0 ? '+' : '' }${ percentage }%` }
						</Text>
					</>
				);
			},
			valueFormatter: ( value: number ) => `$${ formatNumberCompact( value ) }`,
		},
	},
};
