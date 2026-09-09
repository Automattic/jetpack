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

const renderWideTooltip =
	( minWidth: number ) =>
	( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
		const nearestDatum = tooltipData?.nearestDatum?.datum;
		if ( ! nearestDatum ) return null;

		return (
			<div style={ { minWidth } }>
				<strong>{ nearestDatum.date?.toLocaleDateString() }</strong>
				<div>
					{ Object.entries( tooltipData?.datumByKey || {} )
						.map( ( [ key, { datum } ] ) => `${ key }: ${ datum.value }` )
						.join( ' · ' ) }
				</div>
			</div>
		);
	};

type ClippingCardArgs = {
	cardWidth: number;
	tooltipMinWidth: number;
};

// A card that cuts its overflow off, like a dashboard widget. The chart fills
// the card's content box, so the tooltip has only the card's padding to spare.
const ClippingCardTemplate: StoryFn< ClippingCardArgs > = ( { cardWidth, tooltipMinWidth } ) => (
	<div
		style={ {
			width: cardWidth,
			padding: 24,
			boxSizing: 'border-box',
			overflow: 'hidden',
			border: '1px solid #ccc',
			borderRadius: 8,
		} }
	>
		<h4 style={ { margin: '0 0 12px' } }>Card with overflow: hidden</h4>
		<LineChart
			{ ...tooltipStoryArgs }
			width={ cardWidth - 48 }
			height={ 220 }
			renderTooltip={ renderWideTooltip( tooltipMinWidth ) }
		/>
	</div>
);

export const InsideClippingCard: StoryObj< ClippingCardArgs > = ClippingCardTemplate.bind( {} );
InsideClippingCard.args = {
	cardWidth: 400,
	tooltipMinWidth: 260,
};
InsideClippingCard.parameters = {
	docs: {
		description: {
			story:
				'The box is wider than half the chart, so near the middle it fits on neither side. It leaves the chart and stops at the edge of the card instead of being cut off.',
		},
	},
};

export const WiderThanClippingCard: StoryObj< ClippingCardArgs > = ClippingCardTemplate.bind( {} );
WiderThanClippingCard.args = {
	cardWidth: 240,
	tooltipMinWidth: 320,
};
WiderThanClippingCard.parameters = {
	docs: {
		description: {
			story:
				'The box is wider than the whole card. It is pinned to the left edge of the card, so its start is always visible, and the card cuts the rest off. Nothing inside the chart can render outside an ancestor that hides its overflow.',
		},
	},
};
