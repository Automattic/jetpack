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
	backgroundColor: '#FFFFFF',
	labelBackgroundColor: '#FFFFFF',
	colors: [
		'#069e08', // --jp-green-primary (--jp-green-40)
		'#2fb41f', // --jp-green-secondary (--jp-green-30)
		'#64ca43', // --jp-green-20
		'#9dd977', // --jp-green-10
	],
	gridStyles: {
		stroke: '#DCDCDE',
		strokeWidth: 1,
	},
	tickLength: 4,
	gridColor: '#DCDCDE',
	gridColorDark: '#1e1e1e',
	xTickLineStyles: { stroke: '#1e1e1e' },
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

/**
 * WPCOM theme configuration using official Calypso colors
 */
const wpcomTheme: ChartTheme = {
	backgroundColor: '#FFFFFF',
	labelBackgroundColor: '#FFFFFF',
	colors: [
		'#2271b1', // --studio-wordpress-blue-60
		'#72aee6', // --studio-wordpress-blue-30
		'#135e96', // --studio-wordpress-blue-70
		'#c3c4c7', // --studio-wordpress-blue-10
	],
	gridStyles: {
		stroke: '#1e1e1e', // --studio-gray-100
		strokeWidth: 1,
	},
	tickLength: 4,
	gridColor: '#c3c4c7', // --studio-wordpress-blue-10
	gridColorDark: '#1e1e1e', // --studio-gray-100
	xTickLineStyles: {
		stroke: '#1e1e1e', // --studio-gray-100
	},
	xAxisLineStyles: {
		stroke: '#c3c4c7', // --studio-wordpress-blue-10
		strokeWidth: 1,
	},
};

export { defaultTheme, jetpackTheme, wooTheme, wpcomTheme };
