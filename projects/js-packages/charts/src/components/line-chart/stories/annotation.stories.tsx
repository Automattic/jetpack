import { GlyphTriangle } from '@visx/glyph';
import { ChartStoryArgs, temperatureData as sampleData } from '../../../stories';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { LineChartAnnotationProps } from '../types';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Annotations',
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

// Consolidated annotation configuration story with interactive controls
export const AnnotationConfiguration: StoryObj< typeof LineChart > = {
	render: args => {
		const subjectType = args.annotationSubjectType || 'circle';
		const withCustomColors = args.withCustomColors || false;

		const createColoredStyle = ( color: string ) => ( {
			circleSubject: { fill: color },
			connector: { stroke: color },
			label: { anchorLineStroke: color },
		} );

		const annotations = [
			{
				datum: sampleData[ 0 ].data[ 10 ],
				title: 'Notable event',
				subtitle: 'This is a notable event',
				subjectType,
				styles: withCustomColors ? createColoredStyle( '#98C8DF' ) : {},
			},
			{
				datum: sampleData[ 1 ].data[ 1 ],
				title: 'Another notable event',
				subtitle: 'This is another notable event',
				subjectType,
				styles: withCustomColors ? createColoredStyle( '#006DAB' ) : {},
			},
			{
				datum: sampleData[ 2 ].data[ 7 ],
				title: 'Concerning event',
				subtitle: 'This is a concerning event',
				subjectType,
				styles: withCustomColors ? createColoredStyle( 'var(--jp-red)' ) : {},
			},
		];

		return (
			<LineChart { ...args }>
				<LineChart.AnnotationsOverlay>
					{ annotations.map( ( annotation, index ) => (
						<LineChart.Annotation key={ index } { ...annotation } />
					) ) }
				</LineChart.AnnotationsOverlay>
			</LineChart>
		);
	},
	args: {
		...lineChartStoryArgs,
		annotationSubjectType: 'circle',
		withCustomColors: false,
	},
	argTypes: {
		annotationSubjectType: {
			control: { type: 'radio' },
			options: [ 'circle', 'line-vertical', 'line-horizontal' ],
			description: 'Type of annotation marker',
		},
		withCustomColors: {
			control: { type: 'boolean' },
			description: 'Apply custom colors to annotations',
		},
	},
	parameters: {
		docs: {
			description: {
				story: `Interactive annotation configuration with all available controls. Use the controls panel to explore different annotation types and styling options.

**Subject Types:**
- **Circle**: Point annotation marking a specific data point
- **Line Vertical**: Vertical line annotation spanning the chart height, useful for marking events or time periods
- **Line Horizontal**: Horizontal line annotation spanning the chart width, useful for marking threshold values

**Styling Options:**
- **Default**: Uses chart theme colors for consistency
- **Custom Colors**: Applies distinct colors to each annotation for emphasis or categorization

**Use Cases:**
- Circle: Highlight specific data points, outliers, or important events
- Vertical lines: Mark releases, deployments, or time-based events
- Horizontal lines: Show targets, thresholds, or baseline values`,
			},
		},
	},
};

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
