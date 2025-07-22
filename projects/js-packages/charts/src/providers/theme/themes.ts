import type { ChartTheme } from '../../types';

/**
 * Default theme configuration
 */
const defaultTheme: ChartTheme = {
	backgroundColor: '#FFFFFF', // chart background color
	labelBackgroundColor: '#FFFFFF', // label background color
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
		primaryColor: '#3858E9',
		secondaryColor: '#80C8FF',
		deltaColors: [ '#D63638', '#757575', '#008A20' ], // [negative, neutral, positive]
	},
};

/**
 * Jetpack theme configuration
 */
const jetpackTheme: ChartTheme = {
	backgroundColor: '#FFFFFF', // chart background color
	labelBackgroundColor: '#FFFFFF', // label background color
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
		primaryColor: '#006DAB',
		secondaryColor: '#98C8DF',
		deltaColors: [ '#FF8C8F', '#757575', '#1F9828' ], // [negative, neutral, positive]
	},
};

/**
 * Woo theme configuration
 */
const wooTheme: ChartTheme = {
	backgroundColor: '#FFFFFF', // chart background color
	labelBackgroundColor: '#FFFFFF', // label background color
	colors: [ '#80C8FF', '#B999FF', '#3858E9' ],
	gridStyles: {
		stroke: '#787C82',
		strokeWidth: 1,
	},
	tickLength: 4,
	gridColor: '',
	gridColorDark: '',
	xTickLineStyles: { stroke: 'black' },
	xAxisLineStyles: { stroke: '#DCDCDE', strokeWidth: 1 },
	legendLabelStyles: {
		fontSize: '12px',
		fontWeight: 400,
		color: '#757575',
	},
	legendContainerStyles: {
		gap: '8px',
	},
	annotationStyles: {
		label: {
			anchorLineStroke: 'black',
			backgroundFill: '#fff',
		},
		connector: {
			stroke: 'black',
		},
		circleSubject: {
			stroke: 'transparent',
			fill: 'black',
			radius: 5,
		},
	},
	leaderboardChart: {
		rowGap: 12,
		columnGap: 4,
		labelSpacing: 1.5,
		primaryColor: '#3858E9',
		secondaryColor: '#80C8FF',
		deltaColors: [ '#D63638', '#757575', '#008A20' ], // [negative, neutral, positive]
	},
};

export { defaultTheme, jetpackTheme, wooTheme };
