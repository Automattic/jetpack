import { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import { ChartStoryArgs } from '../../../stories';
import { DataPointDate } from '../../../types';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
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

/**
 * Manual regression check for two interactions that the package historically
 * got wrong.
 *
 * Tooltip glyphs and the tooltip box must track the chart line at any page
 * scroll offset. The tall spacer below scrolls the chart well past the fold;
 * hovering after scrolling should keep the tooltip glued to the line. (Bug
 * previously seen with the `useTooltipPortalRelocator` hook, which has been
 * removed.)
 *
 * Tooltips must render above sticky headers. visx tooltips portal to
 * `document.body`, so this is achieved with plain CSS — give `.visx-tooltip`
 * a higher `z-index` than the header. The original z-index issue PR #47118
 * tried to fix should now be solved at the consumer level via stacking-context CSS.
 */
export const ScrollableWithStickyHeader: StoryObj< typeof LineChart > = {
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		( Story: StoryFn ) => (
			<>
				<style>{ `.visx-tooltip { z-index: 1000; }` }</style>
				<div style={ { height: '100vh', overflow: 'auto' } }>
					<header
						style={ {
							position: 'sticky',
							top: 0,
							zIndex: 100,
							background: '#1d2327',
							color: 'white',
							padding: '16px 24px',
							fontFamily: 'system-ui, sans-serif',
						} }
					>
						Sticky header (z-index: 100). Scroll down, then hover the chart — tooltip should stay
						snapped to the line and render above this bar.
					</header>
					<div style={ { height: '120vh' } } aria-hidden>
						<p
							style={ {
								padding: '24px',
								color: '#50575e',
								fontFamily: 'system-ui, sans-serif',
							} }
						>
							Scroll past this filler so the chart lives below the fold.
						</p>
					</div>
					<div style={ { padding: '24px' } }>
						<Story />
					</div>
					<div style={ { height: '50vh' } } aria-hidden />
				</div>
			</>
		),
	],
	render: args => <LineChart { ...args } />,
	args: {
		...tooltipStoryArgs,
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
