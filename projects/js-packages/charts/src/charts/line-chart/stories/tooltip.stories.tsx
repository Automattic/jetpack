import { ChartStoryArgs } from '../../../stories';
import { DataPointDate } from '../../../types';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { RenderTooltipParams } from '../../../visx/types';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Line Chart/Tooltips',
	component: lineChartMetaArgs.component, // Make eslint happy.
};

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const tooltipStoryArgs = {
	...lineChartStoryArgs,
};

export const Default: StoryObj< typeof LineChart > = Template.bind( {} );
Default.args = {
	...tooltipStoryArgs,
};

export const NoTooltips: StoryObj< typeof LineChart > = Template.bind( {} );
NoTooltips.args = {
	...tooltipStoryArgs,
	withTooltips: false,
};

export const Crosshairs: StoryObj< typeof LineChart > = Template.bind( {} );
Crosshairs.args = {
	...tooltipStoryArgs,
	withTooltipCrosshairs: {
		showVertical: true,
		showHorizontal: true,
	},
};

export const CrosshairVertical: StoryObj< typeof LineChart > = Template.bind( {} );
CrosshairVertical.args = {
	...tooltipStoryArgs,
	withTooltipCrosshairs: {
		showVertical: true,
	},
};

export const CrosshairHorizontal: StoryObj< typeof LineChart > = Template.bind( {} );
CrosshairHorizontal.args = {
	...tooltipStoryArgs,
	withTooltipCrosshairs: {
		showHorizontal: true,
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
