import { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import { ChartStoryArgs } from '../../../stories';
import { DataPointDate } from '../../../types';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Tooltips',
};

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const tooltipStoryArgs = {
	...lineChartStoryArgs,
};

// Consolidated tooltip configuration story with interactive controls
export const TooltipConfiguration: StoryObj< typeof LineChart > = {
	render: args => {
		const crosshairMapping = {
			none: undefined,
			vertical: { showVertical: true },
			horizontal: { showHorizontal: true },
			both: { showVertical: true, showHorizontal: true },
		};

		const crosshairMode = args.crosshairMode || 'none';
		const withTooltipCrosshairs = crosshairMapping[ crosshairMode ];

		return <LineChart { ...args } withTooltipCrosshairs={ withTooltipCrosshairs } />;
	},
	args: {
		...tooltipStoryArgs,
		withTooltips: true,
		crosshairMode: 'none',
	},
	argTypes: {
		withTooltips: {
			control: { type: 'boolean' },
			description: 'Enable or disable tooltips',
		},
		crosshairMode: {
			control: { type: 'radio' },
			options: [ 'none', 'vertical', 'horizontal', 'both' ],
			description: 'Crosshair display mode',
		},
	},
	parameters: {
		docs: {
			description: {
				story: `Interactive tooltip configuration with all available controls. Use the controls panel to explore different tooltip and crosshair options.

**Key Features:**
- **Tooltips**: Toggle tooltips on/off to see chart with and without hover information
- **Crosshairs**: Choose between no crosshairs, vertical, horizontal, or both
  - **Vertical**: Shows a vertical line at cursor position for comparing values across series
  - **Horizontal**: Shows a horizontal line for identifying specific value levels
  - **Both**: Combined vertical and horizontal crosshairs for precise data point location

**Use Cases:**
- No crosshairs: Clean minimal look, best for simple data
- Vertical: Best for comparing multiple series at same x-axis point
- Horizontal: Best for identifying threshold values
- Both: Maximum precision for dense or detailed data`,
			},
		},
	},
};

export const Custom: StoryObj< typeof LineChart > = Template.bind( {} );
Custom.args = {
	...tooltipStoryArgs,
	renderTooltip: ( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
		const nearestDatum = tooltipData?.nearestDatum?.datum;
		if ( ! nearestDatum ) return null;

		const tooltipPoints = Object.entries( tooltipData?.datumByKey || {} )
			.map( ( [ key, { datum } ] ) => ( {
				key,
				value: datum.value as number,
			} ) )
			.sort( ( a, b ) => b.value - a.value );

		return (
			<div>
				<h3>{ nearestDatum?.date?.toLocaleDateString() } 💯 </h3>

				<table style={ { border: '1px solid black', borderCollapse: 'collapse' } }>
					<tbody>
						{ tooltipPoints.map( point => (
							<tr style={ { border: '1px solid black' } } key={ point.key }>
								<td style={ { border: '1px solid black' } }>{ point.key }</td>
								<td>{ point.value }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		);
	},
};
