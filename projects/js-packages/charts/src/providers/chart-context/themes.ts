import type { CompleteChartTheme } from '../../types';

/**
 * Default theme configuration
 */
const defaultTheme: CompleteChartTheme = {
	backgroundColor: '#FFFFFF', // chart background color
	labelBackgroundColor: 'transparent', // label background color (transparent by default)
	labelTextColor: '#FFFFFF', // label text color (white to match original behavior)
	colors: [ '#98C8DF', '#006DAB', '#A6DC80', '#1F9828', '#FF8C8F' ],
	gridStyles: {
		stroke: '#DCDCDE',
		strokeWidth: 1,
	},
	tickLength: 4,
	gridColor: '',
	gridColorDark: '',
	xTickLineStyles: { stroke: 'black' },
	xAxisLineStyles: { stroke: '#DCDCDE', strokeWidth: 1 },
	legend: {
		labelStyles: {
			color: 'var(--jp-gray-80, #2c3338)',
		},
		containerStyles: {},
		shapeStyles: [],
	},
	seriesLineStyles: [],
	glyphs: [],
	// `fontFamily: 'inherit'` overrides visx's hardcoded default font stack
	// (`-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif`)
	// that `buildChartTheme` injects as an inline style on SVG `<text>`
	// elements for axis labels and ticks. Setting `inherit` lets SVG text
	// pick up the host application's font-family via normal CSS inheritance.
	svgLabelSmall: { fill: 'var(--jp-gray-80, #2c3338)', fontFamily: 'inherit' },
	svgLabelBig: { fontFamily: 'inherit' },
	annotationStyles: {
		label: {
			anchorLineStroke: 'var(--jp-gray-80, #2c3338)',
			backgroundFill: '#fff',
		},
		connector: {
			stroke: 'var(--jp-gray-80, #2c3338)',
		},
		circleSubject: {
			stroke: 'transparent',
			fill: 'var(--jp-gray-80, #2c3338)',
			radius: 5,
		},
	},
	geoChart: {
		featureFillColor: 'var(--jp-gray-0, #f6f7f7)',
	},
	leaderboardChart: {
		rowGap: 12,
		columnGap: 4,
		labelSpacing: 'xs',
		deltaColors: [ '#FF8C8F', '#757575', '#1F9828' ], // [negative, neutral, positive]
	},
	conversionFunnelChart: {
		backgroundColor: '#F3F4F6',
		positiveChangeColor: '#1F9828',
		negativeChangeColor: '#FF8C8F',
	},
	lineChart: {
		lineStyles: {
			comparison: {
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
			},
		},
	},
	barChart: {
		barStyles: {
			comparison: {
				widthFactor: 1.5,
				opacity: 0.5,
			},
		},
	},
	sparkline: {
		margin: { top: 2, right: 2, bottom: 2, left: 2 },
		strokeWidth: 1.5,
	},
};

export { defaultTheme };
