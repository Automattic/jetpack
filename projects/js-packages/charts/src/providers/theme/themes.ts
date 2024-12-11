import type { ChartTheme } from '../../components/shared/types';

/**
 * Default theme configuration
 */
const defaultTheme: ChartTheme = {
	backgroundColor: 'white',
	colors: [ '#3182ce' ],
	gridStyles: {
		stroke: '#e2e8f0',
		strokeWidth: 1,
	},
	tickLength: 0,
	gridColor: '',
	gridColorDark: '',
};

export { defaultTheme };
