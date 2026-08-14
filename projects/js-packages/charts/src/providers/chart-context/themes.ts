import type { CompleteChartTheme } from '../../types';

/**
 * Default theme configuration
 */
const defaultTheme: CompleteChartTheme = {
	backgroundColor: 'var(--a8c-charts-color-background, #fff)',
	labelBackgroundColor: 'transparent', // label background color (transparent by default)
	// White label text sits on top of arbitrary series colors, so it has no WPDS
	// content-foreground equivalent. Every other colour here is a bare pointer at the
	// catalog emitted by `chart-scope.scss`; the terminal literal is the last
	// resort for the SSR and jsdom paths, where getComputedStyle resolves nothing.
	labelTextColor: 'var(--a8c-charts-color-label-on-fill, #FFFFFF)',
	colors: [ '#98C8DF', '#006DAB', '#A6DC80', '#1F9828', '#FF8C8F' ],
	gridStyles: {
		stroke: 'var(--a8c-charts-color-grid, #dbdbdb)',
		strokeWidth: 1,
	},
	tickLength: 4,
	gridColor: '',
	gridColorDark: '',
	xTickLineStyles: {
		stroke: 'var(--a8c-charts-color-tick, #dbdbdb)',
		strokeWidth: 1,
	},
	xAxisLineStyles: {
		stroke: 'var(--a8c-charts-color-axis, #dbdbdb)',
		strokeWidth: 1,
	},
	legend: {
		labelStyles: {
			color: 'var(--a8c-charts-color-label, #1e1e1e)',
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
	svgLabelSmall: {
		fill: 'var(--a8c-charts-color-label, #1e1e1e)',
		fontFamily: 'inherit',
	},
	svgLabelBig: { fontFamily: 'inherit' },
	annotationStyles: {
		label: {
			anchorLineStroke: 'var(--a8c-charts-color-annotation, #1e1e1e)',
			backgroundFill: 'var(--a8c-charts-color-background, #fff)',
		},
		connector: {
			stroke: 'var(--a8c-charts-color-annotation, #1e1e1e)',
		},
		circleSubject: {
			stroke: 'transparent',
			fill: 'var(--a8c-charts-color-annotation, #1e1e1e)',
			radius: 5,
		},
	},
	geoChart: {
		featureFillColor: 'var(--a8c-charts-color-surface-secondary, #f4f4f4)',
	},
	leaderboardChart: {
		rowGap: 12,
		columnGap: 4,
		labelSpacing: 'xs',
		// [negative, neutral, positive]
		deltaColors: [
			'var(--a8c-charts-color-trend-down, #cc1818)',
			'var(--a8c-charts-color-trend-neutral, #707070)',
			'var(--a8c-charts-color-trend-up, #008030)',
		],
	},
	conversionFunnelChart: {
		backgroundColor: 'var(--a8c-charts-color-surface-secondary, #f4f4f4)',
		positiveChangeColor: 'var(--a8c-charts-color-trend-up, #008030)',
		negativeChangeColor: 'var(--a8c-charts-color-trend-down, #cc1818)',
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
	// `primaryColor` is left unset so it falls back to the palette's `colors[0]`. The compact
	// 11px square / 2px gap is the contribution-graph rhythm, which has no WPDS dimension.
	heatmapChart: {
		compactCellGap: 2,
		compactCellSize: 11,
	},
};

export { defaultTheme };
