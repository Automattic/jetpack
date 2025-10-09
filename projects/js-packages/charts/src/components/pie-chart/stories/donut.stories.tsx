/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	__experimentalText as WPText,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { Fragment } from 'react';
import { BaseLegendItem } from '../../../components/legend/types';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
	legendArgTypes,
	themeArgTypes,
} from '../../../stories';
import { customerRevenueData, customerRevenueLegendData } from '../../../stories/sample-data';
import { Group } from '../../../visx/group';
import { Text } from '../../../visx/text';
import { PieChart, PieChartUnresponsive } from '../../pie-chart';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieChart > > & {
	centerContent?: string;
};

const data = [
	{
		label: 'Active Users',
		value: 65000,
		valueDisplay: '65K',
		percentage: 65,
	},
	{
		label: 'Inactive Users',
		value: 35000,
		valueDisplay: '35K',
		percentage: 35,
	},
];

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Donut Chart',
	component: PieChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		...legendArgTypes,
		size: {
			control: {
				type: 'range',
				min: 100,
				max: 800,
				step: 10,
				default: 400,
			},
			description: 'Diameter of the donut chart in pixels',
			table: { category: 'Dimensions' },
		},
		thickness: {
			control: {
				type: 'range',
				min: 0.2,
				max: 0.8,
				step: 0.01,
			},
			description: 'Donut thickness (0.2 = thin, 0.5 = medium, 0.8 = thick)',
			table: { category: 'Visual Style' },
		},
		gapScale: {
			control: {
				type: 'range',
				min: 0,
				max: 0.05,
				step: 0.01,
			},
			description: 'Gap between segments',
			table: { category: 'Visual Style' },
		},
		cornerScale: {
			control: {
				type: 'range',
				min: 0,
				max: 0.05,
				step: 0.01,
			},
			description: 'Corner rounding',
			table: { category: 'Visual Style' },
		},
		centerContent: {
			control: { type: 'radio' },
			options: [ 'none', 'user-activity', 'doughnut-emoji' ],
			description: 'Content to display in the donut center',
			table: { category: 'Data' },
		},
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

// Interactive configuration story with all donut controls
export const Configuration: Story = {
	render: args => {
		const centerContent = args.centerContent || 'user-activity';

		const centerContentMap = {
			none: undefined,
			'user-activity': (
				<Group>
					<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 24 } y={ -16 }>
						User Activity
					</Text>
					<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 18 } y={ 16 }>
						Total: 100K Users
					</Text>
				</Group>
			),
			'doughnut-emoji': (
				<Group>
					<Text textAnchor="middle" verticalAnchor="middle" fontSize={ 24 } y={ -16 }>
						🍩 Doughnut
					</Text>
					<Text textAnchor="middle" verticalAnchor="middle" fill="#008A20" fontSize={ 18 } y={ 16 }>
						Three donuts for the price of one!
					</Text>
				</Group>
			),
		};

		return <PieChart { ...args }>{ centerContentMap[ centerContent ] }</PieChart>;
	},
	args: {
		data,
		size: 400,
		containerWidth: '432px',
		containerHeight: '432px',
		resize: 'none',
		thickness: 0.5,
		gapScale: 0.03,
		cornerScale: 0.03,
		withTooltips: true,
		showLegend: false,
		centerContent: 'user-activity',
	},
	parameters: {
		docs: {
			description: {
				story: `Interactive donut chart configuration with all available controls. Use the controls panel to explore different thickness, gap, corner, and center content options.

**Key Features:**
- **Thickness**: Adjust from thin (0.2) to thick (0.8) donut
- **Gap Scale**: Control spacing between segments
- **Corner Scale**: Add rounded corners to segments
- **Center Content**: Display custom text, icons, or metrics in the center
- **Legend**: Toggle and configure legend positioning
- **Tooltips**: Enable interactive hover information

**Use Cases:**
- **Thin donut (0.2)**: Elegant, minimalist look for simple data
- **Medium donut (0.5)**: Balanced visibility of data and center content
- **Thick donut (0.8)**: Emphasis on data segments, less on center`,
			},
		},
	},
};

// Custom legend component for advanced use cases
const WooPieLegend = ( {
	chartItems,
	items,
	withComparison,
}: {
	chartItems: BaseLegendItem[];
	items: { label: string; value: number; formattedValue: string; comparison: string }[];
	withComparison: boolean;
} ) => (
	<div
		style={ {
			display: 'inline-grid',
			gridTemplateColumns: '1fr auto auto',
			gap: 'var(--wpds-spacing-05, 5px) var(--wpds-spacing-10, 10px)',
		} }
	>
		{ items.map( ( item, index ) => {
			const { color } = chartItems[ index ];

			return (
				<Fragment key={ index }>
					<HStack direction="row" justify="flex-start" gap={ 2 }>
						<div
							style={ {
								width: '8px',
								height: '8px',
								borderRadius: '50%',
								flexShrink: 0,
								backgroundColor: color,
							} }
						/>
						<WPText size="small">{ item.label }</WPText>
					</HStack>
					<WPText size="small" weight={ 600 } style={ { textAlign: 'right' } }>
						{ item.formattedValue }
					</WPText>
					<WPText size="small" style={ { textAlign: 'right', color: '#008a20' } }>
						{ withComparison && item.comparison }
					</WPText>
				</Fragment>
			);
		} ) }
	</div>
);

export const CustomLegend: Story = {
	render: args => (
		<PieChartUnresponsive { ...args }>
			<PieChartUnresponsive.Legend
				// eslint-disable-next-line react/jsx-no-bind
				render={ items => (
					<WooPieLegend
						chartItems={ items }
						items={ customerRevenueLegendData }
						withComparison={ args.withComparison }
					/>
				) }
			/>
		</PieChartUnresponsive>
	),
	args: {
		data: customerRevenueData.map( segment => ( { ...segment, label: '' } ) ),
		thickness: 0.3,
		cornerScale: 0.03,
		gapScale: 0.01,
		size: 164,
		withComparison: true,
		withTooltips: false,
		containerHeight: '300px',
		resize: 'none',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates how to customize the legend using the render prop pattern for advanced styling and layout control.',
			},
		},
	},
};
