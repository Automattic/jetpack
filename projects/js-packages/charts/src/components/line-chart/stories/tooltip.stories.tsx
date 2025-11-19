import { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import { ChartStoryArgs, localizedTooltipData } from '../../../stories';
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

/**
 * Demonstrates number localization in tooltips with values that clearly show formatting differences
 * across locales. Use browser developer tools to change locale:
 * - Chrome/Edge: DevTools > ... > More tools > Sensors > Locale
 * - Firefox: about:config > intl.accept_languages
 *
 * Example values demonstrate:
 * - Thousand separators: 1,234 (en-US) vs 1.234 (de-DE) vs 1 234 (fr-FR)
 * - Decimal separators: 1.5 (en-US) vs 1,5 (de-DE)
 */
export const Localized: StoryObj< typeof LineChart > = {
	render: args => (
		<div>
			<div
				style={ {
					marginBottom: '20px',
					padding: '15px',
					background: '#f5f5f5',
					borderRadius: '4px',
				} }
			>
				<h4 style={ { margin: '0 0 10px 0' } }>Testing Number Localization</h4>
				<p style={ { margin: '0 0 10px 0', fontSize: '14px', color: '#666' } }>
					Tooltip values are formatted according to your browser locale:
				</p>
				<ul style={ { margin: '0 0 10px 0', fontSize: '13px', color: '#666' } }>
					<li>
						<strong>en-US:</strong> 1,234.56 (comma thousands, period decimal)
					</li>
					<li>
						<strong>de-DE:</strong> 1.234,56 (period thousands, comma decimal)
					</li>
					<li>
						<strong>fr-FR:</strong> 1 234,56 (space thousands, comma decimal)
					</li>
					<li>
						<strong>es-ES:</strong> 1.234,56 (period thousands, comma decimal)
					</li>
				</ul>
				<p style={ { margin: '0 0 10px 0', fontSize: '13px', color: '#666' } }>
					Current browser locale: <strong>{ navigator.language }</strong>
				</p>
				<p style={ { margin: '0', fontSize: '13px', color: '#999', fontStyle: 'italic' } }>
					To test with different locales, change browser settings and reload Storybook.
				</p>
			</div>
			<LineChart { ...args } />
		</div>
	),
	args: {
		...tooltipStoryArgs,
		withTooltips: true,
		data: localizedTooltipData,
	},
};
