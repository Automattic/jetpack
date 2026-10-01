import { LineSeries, XYChart } from '@visx/xychart';
import { GlobalChartsProvider } from '../../../providers';
import { AccessibleTooltip } from '../index';
import type { DataPointDate } from '../../../types';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

const DATA: DataPointDate[] = [
	{ date: new Date( '2024-01-01' ), value: 12 },
	{ date: new Date( '2024-02-01' ), value: 18 },
	{ date: new Date( '2024-03-01' ), value: 9 },
	{ date: new Date( '2024-04-01' ), value: 24 },
	{ date: new Date( '2024-05-01' ), value: 16 },
];

const xAccessor = ( d: DataPointDate ) => d.date;
const yAccessor = ( d: DataPointDate ) => d.value;

const renderTooltip: ComponentProps< typeof AccessibleTooltip >[ 'renderTooltip' ] = ( {
	tooltipData,
} ) => {
	const datum = tooltipData?.nearestDatum?.datum;
	if ( ! datum ) return null;
	return (
		<>
			<strong>{ datum.date.toLocaleDateString( 'en-US', { month: 'long' } ) }</strong>
			<div>{ datum.value } visits</div>
		</>
	);
};

const renderCardTooltip: ComponentProps< typeof AccessibleTooltip >[ 'renderTooltip' ] = params => (
	<div
		style={ {
			padding: '12px',
			background: '#fff',
			color: '#1e1e1e',
			border: '1px solid #ddd',
			borderRadius: '8px',
		} }
	>
		{ renderTooltip?.( params ) }
	</div>
);

type Story = StoryObj< typeof AccessibleTooltip >;

const meta = {
	title: 'JS Packages/Charts Library/Components/AccessibleTooltip',
	component: AccessibleTooltip,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'The tooltip for a custom visx `XYChart`. It draws the shared chart tooltip box; set `unstyled` to drop the box and draw your own.',
			},
		},
	},
	render: args => (
		<GlobalChartsProvider>
			<div style={ { position: 'relative' } }>
				<XYChart
					width={ 480 }
					height={ 240 }
					xScale={ { type: 'time' } }
					yScale={ { type: 'linear', zero: true } }
				>
					<LineSeries
						dataKey="visits"
						data={ DATA }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
					/>
					<AccessibleTooltip { ...args } />
				</XYChart>
			</div>
		</GlobalChartsProvider>
	),
	args: {
		renderTooltip,
		snapTooltipToDatumX: true,
		showVerticalCrosshair: true,
	},
} satisfies Meta< typeof AccessibleTooltip >;

export default meta;

export const Default: Story = {};

export const Unstyled: Story = {
	args: {
		unstyled: true,
		renderTooltip: renderCardTooltip,
	},
	parameters: {
		docs: {
			description: {
				story:
					'`unstyled` drops the box and any `style`, so `renderTooltip` draws the whole tooltip. Here it draws a light card.',
			},
		},
	},
};
