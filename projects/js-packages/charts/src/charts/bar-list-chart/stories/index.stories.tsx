import { formatNumberCompact } from '@automattic/number-formatters';
import { Circle } from '@visx/shape';
import { Text } from '@visx/text';
import { useGlobalChartsTheme } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	marketingChannelsComparison as salesByChannel,
	salesByProduct,
	themeArgTypes,
} from '../../../stories';
import BarListChart from '../bar-list-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof BarListChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Bar List Chart',
	component: BarListChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
	},
};

export default meta;

type Story = StoryObj< StoryArgs >;

// Default story with multiple series
export const Default: Story = {
	args: {
		...sharedThemeArgs,
		withTooltips: true,
		data: salesByProduct,
	},
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 600,
		height: 300,
	},
};

export const AspectRatio: Story = {
	args: {
		...Default.args,
		aspectRatio: 0.3,
	},
};

export const MultiSeries: Story = {
	args: {
		...Default.args,
		data: salesByChannel,
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
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
				// eslint-disable-next-line react-hooks/rules-of-hooks
				const theme = useGlobalChartsTheme();
				const circleColor = theme.colors[ 1 ]; // Use second theme color for contrast

				return (
					<>
						<Circle cx={ x + 6 } cy={ y } r={ 8 } fill={ circleColor } />
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
