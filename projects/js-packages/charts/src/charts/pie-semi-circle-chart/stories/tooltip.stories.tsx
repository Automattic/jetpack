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
				'Default semi-circle pie chart with tooltips enabled using the default `label: value` tooltip.',
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
			<div style={ { minWidth: '150px' } }>
				<div
					style={ {
						fontSize: '16px',
						fontWeight: 'bold',
						marginBottom: '8px',
						borderBottom: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
						paddingBottom: '8px',
					} }
				>
					{ tooltipData.label }
				</div>
				<div style={ { display: 'flex', flexDirection: 'column', gap: '4px' } }>
					<div style={ { display: 'flex', justifyContent: 'space-between' } }>
						<span style={ { opacity: 0.75 } }>Value:</span>
						<span style={ { fontWeight: 'bold' } }>{ formatNumber( tooltipData.value ) }</span>
					</div>
					<div style={ { display: 'flex', justifyContent: 'space-between' } }>
						<span style={ { opacity: 0.75 } }>Percentage:</span>
						<span style={ { fontWeight: 'bold' } }>{ tooltipData.percentage }%</span>
					</div>
				</div>
			</div>
		);
	},
};
Custom.parameters = {
	docs: {
		description: {
			story: `Custom tooltip rendering using the \`renderTooltip\` prop. The content sets layout only and inherits the tooltip box's colors.

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
			<div style={ { textAlign: 'center' } }>
				<div style={ { fontSize: '32px', marginBottom: '4px' } }>
					{ getEmoji( tooltipData.label ) }
				</div>
				<div style={ { fontWeight: 'bold', fontSize: '14px' } }>{ tooltipData.label }</div>
				<div style={ { opacity: 0.75, fontSize: '12px' } }>{ tooltipData.percentage }% share</div>
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
			<table style={ { borderCollapse: 'collapse' } }>
				<thead>
					<tr>
						<th
							colSpan={ 2 }
							style={ {
								padding: '8px 12px',
								borderBottom: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
								fontWeight: 'bold',
							} }
						>
							{ tooltipData.label }
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td
							style={ {
								padding: '6px 12px',
								borderBottom: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
								opacity: 0.75,
							} }
						>
							Value
						</td>
						<td
							style={ {
								padding: '6px 12px',
								borderBottom: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
								textAlign: 'right',
								fontWeight: 'bold',
							} }
						>
							{ formatNumber( tooltipData.value ) }
						</td>
					</tr>
					<tr>
						<td style={ { padding: '6px 12px', opacity: 0.75 } }>Share</td>
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
