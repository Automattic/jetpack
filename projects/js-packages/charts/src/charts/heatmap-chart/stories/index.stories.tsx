import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { HeatmapChart } from '../index';
import { buildCalendarHeatmapData } from '../private';
import type { DataPointDate } from '../../../types';
import type { HeatmapColumn } from '../types';
import type { Meta, StoryObj } from '@storybook/react';

const matrix: HeatmapColumn[] = Array.from( { length: 12 }, ( _col, col ) => ( {
	label: col % 4 === 0 ? `Q${ Math.floor( col / 4 ) + 1 }` : '',
	data: Array.from( { length: 7 }, ( _row, row ) => ( {
		label: `Col ${ col + 1 }, Row ${ row + 1 }`,
		value: ( col * 7 + row ) % 5 === 0 ? null : ( ( col + row ) % 5 ) + 1,
	} ) ),
} ) );

const calendarSeries: DataPointDate[] = Array.from( { length: 120 }, ( _, index ) => {
	const date = new Date( 2024, 0, 1 + index );
	return { date, value: Math.round( Math.abs( Math.sin( index ) ) * 4 ) };
} );

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof HeatmapChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Heatmap Chart',
	component: HeatmapChart,
	parameters: { layout: 'centered' },
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		compact: { control: 'boolean', table: { category: 'Visual Style' } },
		showValues: { control: 'boolean', table: { category: 'Visual Style' } },
		cellGap: {
			control: { type: 'range', min: 0, max: 12, step: 1 },
			table: { category: 'Visual Style' },
		},
		cellRadius: {
			control: { type: 'range', min: 0, max: 8, step: 1 },
			table: { category: 'Visual Style' },
		},
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		data: matrix,
		rowLabels: [ 'Mon', '', 'Wed', '', 'Fri', '', '' ],
		withTooltips: true,
		containerWidth: '900px',
		containerHeight: '260px',
	},
};

export const Compact: Story = {
	args: { ...Default.args, compact: true, containerHeight: '160px' },
};

export const Calendar: Story = {
	render: args => {
		const { data, rowLabels } = buildCalendarHeatmapData( calendarSeries );
		return <HeatmapChart { ...args } data={ data } rowLabels={ rowLabels } />;
	},
	args: {
		...sharedThemeArgs,
		withTooltips: true,
		containerWidth: '900px',
		containerHeight: '220px',
	},
};

export const WithCompositionLegend: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="composition-heatmap">
			<HeatmapChart.Legend />
		</HeatmapChart>
	),
	args: { ...Default.args },
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 720,
		height: 220,
		containerWidth: '760px',
		containerHeight: '260px',
	},
};

export const ErrorStates: Story = {
	render: () => <HeatmapChart height={ 200 } data={ [] } />,
	args: { containerHeight: '240px' },
};
