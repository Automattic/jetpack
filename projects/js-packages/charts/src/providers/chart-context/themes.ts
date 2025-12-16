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
	legendLabelStyles: {
		color: 'var(--jp-gray-80, #2c3338)',
	},
	legendContainerStyles: {},
	seriesLineStyles: [],
	legendShapeStyles: [],
	glyphs: [],
	svgLabelSmall: { fill: 'var(--jp-gray-80, #2c3338)' },
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
	leaderboardChart: {
		rowGap: 12,
		columnGap: 4,
		labelSpacing: 1.5,
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
	sparkline: {
		margin: { top: 2, right: 2, bottom: 2, left: 2 },
		strokeWidth: 1.5,
	},
};

export { defaultTheme };
