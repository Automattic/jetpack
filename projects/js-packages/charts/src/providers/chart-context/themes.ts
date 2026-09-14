import type { CompleteChartTheme } from '../../types';

/**
 * Default theme configuration: the shape and spacing a consumer can override.
 *
 * For a color, set the matching `--a8c-charts-color-*` role in CSS instead; the `var()`
 * chains that deliver those live in `private/catalog-pointers.ts`.
 */
const defaultTheme: CompleteChartTheme = {
	gridStyles: {
		strokeWidth: 1,
	},
	tickLength: 4,
	xTickLineStyles: {
		strokeWidth: 1,
	},
	xAxisLineStyles: {
		strokeWidth: 1,
	},
	legend: {
		labelStyles: {},
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
	svgLabelSmall: {
		fontFamily: 'inherit',
	},
	svgLabelBig: { fontFamily: 'inherit' },
	annotationStyles: {},
	leaderboardChart: {
		labelSpacing: 'xs',
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
	// The compact 11px square / 2px gap is the contribution-graph rhythm, which has no WPDS dimension.
	heatmapChart: {
		compactCellGap: 2,
		compactCellSize: 11,
	},
};

export { defaultTheme };
