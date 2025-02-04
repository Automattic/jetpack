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
};

export { defaultTheme, jetpackTheme, wooTheme };
