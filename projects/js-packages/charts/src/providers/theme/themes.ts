import type { ChartTheme } from '../../components/shared/types';

/**
 * Default theme configuration
 */
const defaultTheme: ChartTheme = {
	backgroundColor: '#FFFFFF',
	colors: [ '#3182ce' ],
	gridStyles: {
		stroke: '#787C82',
		strokeWidth: 1,
	},
	tickLength: 0,
	gridColor: '',
	gridColorDark: '',
};

const jetpackTheme: ChartTheme = {
	backgroundColor: '#FFFFFF',
	colors: [ '#98C8DF', '#006DAB', '#A6DC80', '#1F9828', '#FF8C8F' ],
	gridStyles: {
		stroke: '#787C82',
		strokeWidth: 1,
	},
	tickLength: 0,
	gridColor: '',
	gridColorDark: '',
};

const wooTheme: ChartTheme = {
	backgroundColor: '#FFFFFF',
	colors: [ '#80C8FF', '#B999FF', '#3858E9' ],
	gridStyles: {
		stroke: '#787C82',
		strokeWidth: 1,
	},
	tickLength: 0,
	gridColor: '',
	gridColorDark: '',
};

export { defaultTheme, jetpackTheme, wooTheme };
