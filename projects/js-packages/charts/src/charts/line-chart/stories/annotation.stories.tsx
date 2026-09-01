import { GlyphTriangle } from '@visx/glyph';
import { ChartStoryArgs, temperatureData as sampleData } from '../../../stories';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { LineChartAnnotationProps } from '../types';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Line Chart/Annotations',
	component: lineChartMetaArgs.component, // Make eslint happy.
	args: {
		...lineChartStoryArgs,
	},
};

export default meta;

const createAnnotationTemplate =
	( annotationArgs?: Array< Partial< LineChartAnnotationProps > > ): StoryFn< typeof LineChart > =>
	args => (
		<LineChart { ...args }>
			<LineChart.AnnotationsOverlay>
				<LineChart.Annotation
					datum={ sampleData[ 0 ].data[ 10 ] }
					title="Notable event"
					subtitle="This is a notable event"
					{ ...( annotationArgs?.[ 0 ] || {} ) }
				/>
				<LineChart.Annotation
					datum={ sampleData[ 1 ].data[ 1 ] }
					title="Another notable event"
					subtitle="This is another notable event"
					{ ...( annotationArgs?.[ 1 ] || {} ) }
				/>
				<LineChart.Annotation
					datum={ sampleData[ 2 ].data[ 7 ] }
					title="Concerning event"
					subtitle="This is a concerning event"
					{ ...( annotationArgs?.[ 2 ] || {} ) }
				/>
			</LineChart.AnnotationsOverlay>
		</LineChart>
	);

const Template = createAnnotationTemplate( [
	{},
	{},
	{
		styles: {
			circleSubject: { fill: 'var(--jp-red)' },
			connector: { stroke: 'var(--jp-red)' },
			label: { anchorLineStroke: 'var(--jp-red)' },
		},
	},
] );

export const Default: StoryObj< typeof LineChart > = Template.bind( {} );

const VerticalTemplate = createAnnotationTemplate( [
	{ subjectType: 'line-vertical' },
	{ subjectType: 'line-vertical' },
	{
		subjectType: 'line-vertical',
		styles: {
			connector: { stroke: 'var(--jp-red)' },
			label: { anchorLineStroke: 'var(--jp-red)' },
		},
	},
] );

export const Vertical: StoryObj< typeof LineChart > = VerticalTemplate.bind( {} );

const HorizontalTemplate = createAnnotationTemplate( [
	{ subjectType: 'line-horizontal' },
	{ subjectType: 'line-horizontal' },
	{
		subjectType: 'line-horizontal',
		styles: {
			connector: { stroke: 'var(--jp-red)' },
			label: { anchorLineStroke: 'var(--jp-red)' },
		},
	},
] );

export const Horizontal: StoryObj< typeof LineChart > = HorizontalTemplate.bind( {} );

const MixedTemplate = createAnnotationTemplate( [
	{ subjectType: 'circle' },
	{ subjectType: 'line-vertical' },
	{
		subjectType: 'line-horizontal',
		styles: {
			connector: { stroke: 'var(--jp-red)' },
			label: { anchorLineStroke: 'var(--jp-red)' },
		},
	},
] );

export const Mixed: StoryObj< typeof LineChart > = MixedTemplate.bind( {} );

const ColoredTemplate = createAnnotationTemplate( [
	{
		styles: {
			label: {
				backgroundFill: '#98C8DF',
				showAnchorLine: false,
			},
			circleSubject: {
				fill: '#98C8DF',
			},
			connector: {
				stroke: '#98C8DF',
			},
		},
	},
	{
		styles: {
			label: {
				backgroundFill: '#006DAB',
				fontColor: '#fff',
				showAnchorLine: false,
			},
			circleSubject: {
				fill: '#006DAB',
			},
			connector: {
				stroke: '#006DAB',
			},
		},
	},
	{
		styles: {
			label: {
				backgroundFill: 'var(--jp-red)',
				showAnchorLine: false,
				fontColor: '#fff',
			},
			circleSubject: {
				fill: 'var(--jp-red)',
			},
			connector: {
				stroke: 'var(--jp-red)',
			},
		},
	},
] );

export const Colored: StoryObj< typeof LineChart > = ColoredTemplate.bind( {} );

const DeployedIcon = () => (
	<span
		style={ {
			background: 'black',
			color: 'white',
			width: '24px',
			height: '24px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: '50%',
		} }
	>
		D
	</span>
);

const customTopAnnotationArgs: Partial< LineChartAnnotationProps > = {
	subjectType: 'line-vertical',
	styles: {
		label: { showAnchorLine: false, y: 'start' },
	},
	title: 'Deployed',
	renderLabel: () => (
		<span style={ { transform: 'translate(0, 6px)' } }>
			<DeployedIcon />
		</span>
	),
	renderLabelPopover: () => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '0.5rem' } }>
			<div
				style={ {
					margin: 0,
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
					paddingBlock: '0.25rem ',
				} }
			>
				<DeployedIcon />
				<strong>Deploy finished</strong>
			</div>
			<p style={ { margin: 0 } }>Thu. Apr 24, 2025. 09:57:23 UTC</p>
		</div>
	),
};

const AlertIcon = () => (
	<span
		style={ {
			background: 'var(--jp-red)',
			color: 'white',
			width: '20px',
			height: '20px',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: '50%',
		} }
	>
		!
	</span>
);

const customBottomAnnotationArgs: Partial< LineChartAnnotationProps > = {
	subjectType: 'circle',
	styles: {
		circleSubject: {
			radius: 0,
		},
		label: {
			showAnchorLine: false,
		},
		connector: {
			stroke: 'transparent',
		},
	},
	title: 'Alert',
	renderLabel: () => <AlertIcon />,
	renderLabelPopover: () => (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '0.5rem' } }>
			<div
				style={ {
					margin: 0,
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
					paddingBlock: '0.25rem ',
				} }
			>
				<AlertIcon />
				<strong>Origin HTTP 5xx Response Codes Rate Anomaly [Beta]</strong>
			</div>
			<p style={ { margin: 0 } }>
				Unusually high number of HTTP 5xx response codes detected on Origin
			</p>
		</div>
	),
};

const CustomTemplate = createAnnotationTemplate( [
	{
		...customTopAnnotationArgs,
	},
	{
		...customTopAnnotationArgs,
	},
	{
		...customBottomAnnotationArgs,
	},
] );

export const Custom: StoryObj< typeof LineChart > = CustomTemplate.bind( {} );

const renderAlertGlyph = ( {
	x,
	y,
	color,
	size,
	key,
}: {
	x: number;
	y: number;
	color: string;
	size: number;
	key?: string;
} ) => {
	// Only render triangles for the Alert series (highlighted portion)
	if ( key && key.includes( 'Alert' ) ) {
		return (
			<GlyphTriangle
				key={ `triangle-${ x }-${ y }` }
				top={ y }
				left={ x }
				size={ size * size }
				fill="white"
				stroke={ color }
				strokeWidth={ 2 }
				transform="rotate(90)"
			/>
		);
	}
	// Return null for the full series to not show glyphs
	return null;
};

const renderAlertLabelPopover = () => (
	<div style={ { display: 'flex', flexDirection: 'column', gap: '0.5rem' } }>
		<div
			style={ {
				margin: 0,
				display: 'flex',
				alignItems: 'center',
				gap: '6px',
				paddingBlock: '0.25rem ',
			} }
		>
			<AlertIcon />
			<strong>Alert</strong>
		</div>
		<p style={ { margin: 0 } }>Highest temperature (27°C) reached</p>
	</div>
);

const AlertTemplate: StoryFn< typeof LineChart > = args => {
	// Use the first series data (New York)
	const fullSeries = {
		...sampleData[ 0 ],
		options: {
			...sampleData[ 0 ].options,
			gradient: {
				fromOpacity: 0,
				toOpacity: 0,
			},
		},
	};

	// Create a highlighted middle portion (roughly from May to September)
	const highlightSeriesData = fullSeries.data.slice( 4, 9 ); // Middle portion of the data

	// Calculate the min and max values to determine the gradient height
	const allValues = fullSeries.data.map( d => d.value );
	const highlightValues = highlightSeriesData.map( d => d.value );

	const chartMin = Math.min( ...allValues );
	const chartMax = Math.max( ...allValues );
	const chartRange = chartMax - chartMin;

	// Find the lowest point in the highlight series
	const highlightMin = Math.min( ...highlightValues );

	// Calculate the percentage from bottom of chart to the lowest highlight point
	// This is where we want the gradient to stop
	const gradientStopPercentage = ( ( highlightMin - chartMin ) / chartRange ) * 100;

	// Since SVG gradients are top-to-bottom, we need to invert this
	const gradientCutoff = 100 - gradientStopPercentage;

	const highlightSeries = {
		...fullSeries,
		group: 'new-york-highlight',
		label: 'Alert',
		data: highlightSeriesData,
		options: {
			stroke: 'var(--jp-red)',
			seriesLineStyle: { strokeWidth: 3 },
			gradient: {
				stops: [
					{ offset: '0%', opacity: 0.5 },
					{ offset: `${ gradientCutoff * 0.75 }%`, opacity: 0 },
					{ offset: '100%', opacity: 0 },
				],
			},
		},
	};

	// Find the peak in the highlighted series (July with value 27)
	const peakDatum = fullSeries.data[ 6 ]; // July - peak temperature

	return (
		<LineChart
			{ ...args }
			smoothing={ false }
			data={ [ fullSeries, highlightSeries ] }
			withGradientFill={ true }
			withStartGlyphs={ true }
			withEndGlyphs={ true }
			renderGlyph={ renderAlertGlyph }
			glyphStyle={ {
				radius: 8,
			} }
		>
			<LineChart.AnnotationsOverlay>
				<LineChart.Annotation
					datum={ peakDatum }
					title="Alert"
					subjectType="circle"
					styles={ {
						circleSubject: {
							radius: 0,
						},
						label: {
							showAnchorLine: false,
						},
						connector: {
							stroke: 'transparent',
						},
					} }
					renderLabel={ AlertIcon }
					renderLabelPopover={ renderAlertLabelPopover }
				/>
			</LineChart.AnnotationsOverlay>
		</LineChart>
	);
};

export const Alert: StoryObj< typeof LineChart > = AlertTemplate.bind( {} );
