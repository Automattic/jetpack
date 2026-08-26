import { formatNumber } from '@automattic/number-formatters';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { legendArgTypes } from '../../../stories/legend-config';
import { partialOsUsageData as data } from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { PieSemiCircleChart, PieSemiCircleChartRenderTooltipParams } from '../index';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const emojiMap: Record< string, string > = {
	Windows: '🪟',
	MacOS: '🍎',
	Linux: '🐧',
	Other: '🖥️',
};

const getEmoji = ( label: string ) => {
	return emojiMap[ label ] || '📊';
};

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof PieSemiCircleChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Pie Semi Circle Chart/Tooltips',
	component: PieSemiCircleChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		...legendArgTypes,
		width: {
			control: {
				type: 'range',
				min: 100,
				max: 1000,
				step: 10,
			},
		},
		thickness: {
			control: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
	},
};

export default meta;

const Template: StoryFn< StoryArgs > = args => <PieSemiCircleChart { ...args } />;

const tooltipStoryArgs = {
	...sharedThemeArgs,
	data,
	withTooltips: true,
	label: 'OS Usage',
	note: 'Q4 2023',
};

export const Default: StoryObj< StoryArgs > = Template.bind( {} );
Default.args = {
	...tooltipStoryArgs,
};
Default.parameters = {
	docs: {
		description: {
			story:
				'Default semi-circle pie chart with tooltips enabled using the built-in BaseTooltip component.',
		},
	},
};

export const NoTooltips: StoryObj< StoryArgs > = Template.bind( {} );
NoTooltips.args = {
	...tooltipStoryArgs,
	withTooltips: false,
};
NoTooltips.parameters = {
	docs: {
		description: {
			story: 'Semi-circle pie chart with tooltips disabled.',
		},
	},
};

export const Custom: StoryObj< StoryArgs > = Template.bind( {} );
Custom.args = {
	...tooltipStoryArgs,
	renderTooltip: ( { tooltipData }: PieSemiCircleChartRenderTooltipParams ) => {
		return (
			<div
				style={ {
					backgroundColor: '#1a1a2e',
					color: '#eaeaea',
					padding: '12px 16px',
					borderRadius: '8px',
					boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
					minWidth: '150px',
				} }
			>
				<div
					style={ {
						fontSize: '16px',
						fontWeight: 'bold',
						marginBottom: '8px',
						borderBottom: '1px solid #333',
						paddingBottom: '8px',
					} }
				>
					{ tooltipData.label }
				</div>
				<div style={ { display: 'flex', flexDirection: 'column', gap: '4px' } }>
					<div style={ { display: 'flex', justifyContent: 'space-between' } }>
						<span style={ { color: '#888' } }>Value:</span>
						<span style={ { fontWeight: 'bold' } }>{ formatNumber( tooltipData.value ) }</span>
					</div>
					<div style={ { display: 'flex', justifyContent: 'space-between' } }>
						<span style={ { color: '#888' } }>Percentage:</span>
						<span
							style={ {
								fontWeight: 'bold',
								color: '#4ade80',
							} }
						>
							{ tooltipData.percentage }%
						</span>
					</div>
				</div>
			</div>
		);
	},
};
Custom.parameters = {
	docs: {
		description: {
			story: `Custom tooltip rendering using the \`renderTooltip\` prop. This example demonstrates a dark-themed tooltip with styled layout.

**Usage:**
\`\`\`tsx
<PieSemiCircleChart
  data={data}
  withTooltips={true}
  renderTooltip={({ tooltipData }) => (
    <div>
      <h3>{tooltipData.label}</h3>
      <p>Value: {tooltipData.value}</p>
      <p>Percentage: {tooltipData.percentage}%</p>
    </div>
  )}
/>
\`\`\``,
		},
	},
};

export const CustomWithEmoji: StoryObj< StoryArgs > = Template.bind( {} );
CustomWithEmoji.args = {
	...tooltipStoryArgs,
	renderTooltip: ( { tooltipData }: PieSemiCircleChartRenderTooltipParams ) => {
		return (
			<div
				style={ {
					backgroundColor: 'white',
					padding: '12px',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
					textAlign: 'center',
				} }
			>
				<div style={ { fontSize: '32px', marginBottom: '4px' } }>
					{ getEmoji( tooltipData.label ) }
				</div>
				<div style={ { fontWeight: 'bold', fontSize: '14px' } }>{ tooltipData.label }</div>
				<div style={ { color: '#666', fontSize: '12px' } }>{ tooltipData.percentage }% share</div>
			</div>
		);
	},
};
CustomWithEmoji.parameters = {
	docs: {
		description: {
			story:
				'Custom tooltip with emoji icons based on the data label. Demonstrates dynamic content rendering.',
		},
	},
};

export const CustomTableTooltip: StoryObj< StoryArgs > = Template.bind( {} );
CustomTableTooltip.args = {
	...tooltipStoryArgs,
	renderTooltip: ( { tooltipData }: PieSemiCircleChartRenderTooltipParams ) => {
		return (
			<table
				style={ {
					borderCollapse: 'collapse',
					backgroundColor: 'white',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
					borderRadius: '4px',
					overflow: 'hidden',
				} }
			>
				<thead>
					<tr style={ { backgroundColor: '#f5f5f5' } }>
						<th
							colSpan={ 2 }
							style={ { padding: '8px 12px', borderBottom: '1px solid #ddd', fontWeight: 'bold' } }
						>
							{ tooltipData.label }
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td style={ { padding: '6px 12px', borderBottom: '1px solid #eee', color: '#666' } }>
							Value
						</td>
						<td
							style={ {
								padding: '6px 12px',
								borderBottom: '1px solid #eee',
								textAlign: 'right',
								fontWeight: 'bold',
							} }
						>
							{ formatNumber( tooltipData.value ) }
						</td>
					</tr>
					<tr>
						<td style={ { padding: '6px 12px', color: '#666' } }>Share</td>
						<td style={ { padding: '6px 12px', textAlign: 'right', fontWeight: 'bold' } }>
							{ tooltipData.percentage }%
						</td>
					</tr>
				</tbody>
			</table>
		);
	},
};
CustomTableTooltip.parameters = {
	docs: {
		description: {
			story: 'Custom tooltip rendered as an HTML table for a more structured data presentation.',
		},
	},
};

export const TooltipOffset: StoryObj< StoryArgs > = {
	render: () => (
		<div
			style={ {
				display: 'grid',
				gap: '2rem',
				gridTemplateColumns: 'repeat(2, 1fr)',
				alignItems: 'start',
			} }
		>
			<div>
				<h3>Default Offset (0, -15)</h3>
				<PieSemiCircleChart { ...tooltipStoryArgs } width={ 350 } />
			</div>
			<div>
				<h3>Custom Offset (20, -30)</h3>
				<PieSemiCircleChart
					{ ...tooltipStoryArgs }
					width={ 350 }
					tooltipOffsetX={ 20 }
					tooltipOffsetY={ -30 }
				/>
			</div>
		</div>
	),
	args: {
		containerWidth: '800px',
		containerHeight: '300px',
	},
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates tooltip positioning with `tooltipOffsetX` and `tooltipOffsetY` props. The right chart has a custom offset applied.',
			},
		},
	},
};
