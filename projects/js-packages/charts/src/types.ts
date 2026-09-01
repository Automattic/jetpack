import type {
	CircleSubjectProps,
	ConnectorProps,
	LabelProps,
	LineSubjectProps,
} from '@visx/annotation';
import type { AxisScale, Orientation, TickFormatter, AxisRendererProps } from '@visx/axis';
import type { ScaleInput, ScaleType } from '@visx/scale';
import type { TextProps } from '@visx/text';
import type { EventHandlerParams, GlyphProps, GridStyles, LineStyles } from '@visx/xychart';
import type {
	ComponentClass,
	CSSProperties,
	FC,
	MouseEvent,
	PointerEvent,
	ReactElement,
	ReactNode,
} from 'react';

type ValueOf< T > = T[ keyof T ];

export type Optional< T, K extends keyof T > = Pick< Partial< T >, K > & Omit< T, K >;

/**
 * Mirrors the WordPress Design System gap token scale used by the WordPress UI Stack.
 */
export type GapSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type LegendShapeLabel< Data, Output, ExtraAttributes = object > = {
	datum: Data;
	index: number;
	text: string;
	value?: Output;
} & ExtraAttributes;

export type LegendShapeRenderProps< Data, Output > = {
	width?: string | number;
	height?: string | number;
	label: LegendShapeLabel< Data, Output >;
	item: Data;
	itemIndex: number;
	fill?: string;
	size?: string | number;
	style?: CSSProperties;
};

export type LegendShape< Data, Output > =
	| 'rect'
	| 'circle'
	| 'line'
	| FC< LegendShapeRenderProps< Data, Output > >
	| ComponentClass< LegendShapeRenderProps< Data, Output > >;

export type GoogleDataTableColumnType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'date'
	| 'datetime'
	| 'timeofday';

export enum GoogleDataTableColumnRoleType {
	annotation = 'annotation',
	annotationText = 'annotationText',
	certainty = 'certainty',
	emphasis = 'emphasis',
	interval = 'interval',
	scope = 'scope',
	style = 'style',
	tooltip = 'tooltip',
	domain = 'domain',
}

export type GoogleDataTableColumn =
	| {
			type: GoogleDataTableColumnType;
			label?: string;
			role?: GoogleDataTableColumnRoleType;
			pattern?: string;
			p?: Record< string, unknown >;
			id?: string;
	  }
	| string;

export type GoogleDataTableCell =
	| {
			v?: unknown;
			f?: string;
			p?: Record< string, unknown >;
	  }
	| string
	| number
	| boolean
	| Date
	| null;

export type GoogleDataTableRow = GoogleDataTableCell[];

export type ChartType =
	| 'area'
	| 'bar'
	| 'conversion-funnel'
	| 'leaderboard'
	| 'line'
	| 'pie'
	| 'pie-semi-circle';

export type OrientationType = ValueOf< typeof Orientation >;

/**
 * Annotation styling.
 *
 * Each color member is deprecated on its own rather than the field it sits in: `radius`, `stroke` widths and the label geometry alongside them have no catalog role behind them and still apply.
 */
export type AnnotationStyles = {
	circleSubject?: Omit< CircleSubjectProps, 'x' | 'y' | 'fill' > & {
		/** @deprecated Set the `--a8c-charts-color-annotation` custom property inside the provider tree instead. See `TOKENS.md`. */
		fill?: string;
	};
	lineSubject?: Omit< LineSubjectProps, 'x' | 'y' >;
	connector?: Omit< ConnectorProps, 'x' | 'y' | 'dx' | 'dy' | 'stroke' > & {
		/** @deprecated Set the `--a8c-charts-color-annotation` custom property inside the provider tree instead. See `TOKENS.md`. */
		stroke?: ConnectorProps[ 'stroke' ];
	};
	label?: Omit<
		LabelProps,
		'title' | 'subtitle' | 'x' | 'y' | 'anchorLineStroke' | 'backgroundFill'
	> & {
		x?: number | 'start' | 'end';
		y?: number | 'start' | 'end';
		/** @deprecated Set the `--a8c-charts-color-annotation` custom property inside the provider tree instead. See `TOKENS.md`. */
		anchorLineStroke?: LabelProps[ 'anchorLineStroke' ];
		/** @deprecated Set the `--a8c-charts-color-surface` custom property inside the provider tree instead. See `TOKENS.md`. */
		backgroundFill?: LabelProps[ 'backgroundFill' ];
	};
};

export type DataPoint = {
	label: string;
	value: number;
};

/**
 * Data format for GeoChart - uses Google Charts native data format for maximum flexibility.
 * First element is the header row, subsequent elements are data rows.
 *
 * Country identifiers can be either full country names or ISO 3166-1 alpha-2 codes (e.g., 'United States' or 'US').
 * Full names are recommended for better readability in tooltips.
 *
 * @example Basic usage with country names:
 * [['Country', 'Value'], ['United States', 100], ['Canada', 50], ['United Kingdom', 75]]
 *
 * @example With custom HTML tooltips:
 * [
 *   ['Country', 'Value', { type: 'string', role: 'tooltip', p: { html: true } }],
 *   ['United States', 100, '<b>United States</b><br/>100 visitors'],
 *   ['Canada', 50, '<b>Canada</b><br/>50 visitors']
 * ]
 *
 * @example With formatted values (v = value, f = formatted):
 * [
 *   ['Country', 'Value'],
 *   ['United States', { v: 100, f: '100 visitors' }],
 *   ['Canada', { v: 50, f: '50 visitors' }]
 * ]
 *
 * @example With multiple columns:
 * [
 *   ['Country', 'Population', 'Area'],
 *   ['United States', 331000000, 9834000],
 *   ['Canada', 38000000, 9985000]
 * ]
 */
export type GeoData = [ GoogleDataTableColumn[], ...GoogleDataTableRow[] ];

export type DataPointDate = {
	date?: Date;
	/**
	 * Supported Formats:
	 * - YYYY-MM-DD (local)
	 * - YYYY-MM-DD HH:mm:ss (local)
	 * - YYYY-MM-DD HH:mm (local)
	 * - YYYY-MM-DDTHH:mm:ss (local)
	 * - YYYY-MM-DDTHH:mm:ss.SSS (local)
	 * - YYYY-MM-DDTHH:mm (local)
	 * - YYYY-MM-DDTHH:mm:ssZ (UTC → local)
	 * - YYYY-MM-DDTHH:mm:ss±HH:mm (offset → local)
	 */
	dateString?: string;
	value: number | null;
	label?: string;
};

export type LeaderboardEntry = {
	/**
	 * Unique internal key (e.g., 'key-direct')
	 */
	id: string;

	/**
	 * Human-readable name (e.g., 'Direct') or a JSX element (e.g., <h4>Direct</h4>)
	 */
	label: string | ReactElement;

	/**
	 * Value of the entry
	 */
	currentValue: number;

	/**
	 * Value of the entry in the previous period. Omit when this row has no
	 * matching comparison-period value.
	 */
	previousValue?: number;

	/**
	 * Width of current bar, as % of the current value
	 */
	currentShare: number;

	/**
	 * Width of previous bar, as % of the current value. Omit when this row has
	 * no matching comparison-period value.
	 */
	previousShare?: number;

	/**
	 * Delta of the entry. Omit when the percentage change is unavailable, such
	 * as when the row has no comparison value or its previous value is zero.
	 */
	delta?: number;

	/**
	 * Optional color for the entry's image/icon
	 */
	imageColor?: string;

	/**
	 * Optional click handler. When provided, the entire row becomes an
	 * interactive `<button>`: clickable and keyboard-focusable (Enter/Space),
	 * with a chevron affordance revealed on hover/focus. The consumer
	 * decides what the action does (e.g. drill-down). Rows without onClick are
	 * inert and render unchanged.
	 *
	 * For links or other interactive affordances (external-link icons, info
	 * tooltips), put them in the `label` render prop instead of using onClick —
	 * a row is either a button (onClick) or carries interactive label content,
	 * never both, since interactive elements cannot be nested in HTML.
	 */
	onClick?: ( event: MouseEvent< HTMLButtonElement > ) => void;

	/**
	 * Optional accessible name for the interactive row's `<button>`. Only applies
	 * when `onClick` is set — without it the row renders as a Fragment with no
	 * element to receive `aria-label`. By default the button derives its name from
	 * its rendered content (label text plus the formatted value), which is the
	 * right outcome for plain-text labels. Set this when the `label` is JSX whose
	 * text content does not yield a clean name on its own — e.g. an image-only
	 * label — to give assistive tech a deterministic, human-readable name.
	 */
	ariaLabel?: string;
};

export type GradientStop = {
	offset: string;
	color?: string;
	opacity?: number;
};

export type SeriesDataOptions = {
	gradient?: {
		from?: string;
		to?: string;
		fromOpacity?: number;
		toOpacity?: number;
		stops?: GradientStop[];
	};
	stroke?: string;
	seriesLineStyle?: LineStyles;
	legendShapeStyle?: CSSProperties;
	type?: 'comparison';
};

export type SeriesData = {
	group?: string;
	label: string;
	data: DataPointDate[] | DataPoint[];
	options?: SeriesDataOptions;
};

/**
 * Visual styling for a bar series of a given semantic type (e.g. 'comparison').
 * `widthFactor` is the bar width relative to the primary bar slot (1.5 = 150%);
 * `opacity` sets the shadow translucency.
 */
export type BarStyles = {
	widthFactor?: number;
	opacity?: number;
};

export type MultipleDataPointsDate = {
	label: string;
	data: DataPointDate[];
};

/**
 * Input data point for percentage-based charts (pie, donut, semi-circle).
 * Provide values; percentages will be calculated automatically.
 */
export type DataPointPercentage = {
	/**
	 * Label for the data point
	 */
	label: string;
	/**
	 * Numerical value used for slice sizing.
	 * Percentages are calculated automatically from values.
	 */
	value: number;
	/**
	 * Formatted value for display (e.g., "30K" instead of 30000)
	 */
	valueDisplay?: string;
	/**
	 * Color code for the segment, by default colors are taken from the theme but this property can overrides it
	 */
	color?: string;
	/**
	 * Group for the data point, used to match color with groups on other charts
	 */
	group?: string;
};

/**
 * Internal type with calculated percentage.
 * Used internally after percentage calculation from values.
 */
export type DataPointPercentageCalculated = DataPointPercentage & {
	/**
	 * Calculated percentage (0-100) based on value relative to total
	 */
	percentage: number;
};

/**
 * Base theme configuration for chart components with optional properties
 */
export type ChartTheme = {
	/**
	 * Background color for chart components.
	 *
	 * Still resolved in JS — gradient stops, the glyph stroke and `GeoChart`'s Google Charts config each need a concrete string — but that is about where the value is *consumed*, not where it is *set*. `withCatalogPointers` parks a consumer's value in the catalog role and restores the pointer, so the field is only ever a carrier for `--a8c-charts-color-background`, and setting the role directly does the same job.
	 *
	 * Optional so the deprecation is actionable: a consumer writing a full theme literal can now stop setting it. `CompleteChartTheme` is `Required< ChartTheme >`, so `defaultTheme` must still carry one.
	 *
	 * @deprecated Set the `--a8c-charts-color-background` custom property inside the provider tree instead. See `TOKENS.md`.
	 */
	backgroundColor?: string;
	/**
	 * Background color for labels.
	 *
	 * @deprecated Set the `--a8c-charts-color-label-background` custom property inside the provider tree instead. See `TOKENS.md`.
	 */
	labelBackgroundColor?: string;
	/**
	 * Text color for labels.
	 *
	 * @deprecated Set the `--a8c-charts-color-label-on-fill` custom property inside the provider tree instead. See `TOKENS.md`.
	 */
	labelTextColor?: string;
	/**
	 * Series palette seeds. Entry N publishes `--a8c-charts-color-series-{N+1}`; entries past the fifth are ignored.
	 *
	 * Optional so the deprecation is actionable: a consumer writing a full theme literal can now stop setting it. `CompleteChartTheme` is `Required< ChartTheme >`, so `defaultTheme` must still carry one.
	 *
	 * @deprecated Set the `--a8c-charts-color-series-1` … `-5` custom properties inside the provider tree instead, or `options.stroke` on a series for a single one. See `TOKENS.md`.
	 */
	colors?: string[];
	/**
	 * Optional CSS styles for grid lines.
	 *
	 * `stroke` is deprecated on its own, not the whole field: `strokeWidth` has no CSS role behind it and still applies. The same shape is used for the other fields whose color moved to CSS — annotating the field itself would strike through the half that stays.
	 */
	gridStyles?: Omit< GridStyles, 'stroke' > & {
		/** @deprecated Set the `--a8c-charts-color-grid` custom property inside the provider tree instead. See `TOKENS.md`. */
		stroke?: GridStyles[ 'stroke' ];
	};
	/** Length of axis ticks in pixels */
	tickLength: number;
	/**
	 * Set `--a8c-charts-color-grid` for the gridlines.
	 *
	 * @deprecated Do not drop this field without replacing it. Nothing in this package consults it, but `buildChartTheme` seeds `y.left/right.axisLine.stroke` and `y.*.tickLine.stroke` from it, and `defaultTheme`'s empty string is the only thing leaving the y axis unpainted — deleting the field hands those a black `#222` instead. CHARTS-263 replaces it with visx's own `yAxisLineStyles`/`yTickLineStyles` and a pair of catalog roles.
	 */
	gridColor?: string;
	/**
	 * @deprecated Paints nothing, and unlike `gridColor` is safe to delete: `buildChartTheme` seeds `x.*.axisLine.stroke` from it, but spreads `xAxisLineStyles` over the top and `defaultTheme` always carries that stroke. Charts follow the host's theme through the catalog rather than a dark-mode field of their own.
	 */
	gridColorDark?: string;
	/** Styles for x-axis tick lines */
	xTickLineStyles?: Omit< LineStyles, 'stroke' > & {
		/** @deprecated Set the `--a8c-charts-color-tick` custom property inside the provider tree instead. See `TOKENS.md`. */
		stroke?: LineStyles[ 'stroke' ];
	};
	/** Styles for x-axis line */
	xAxisLineStyles?: Omit< LineStyles, 'stroke' > & {
		/** @deprecated Set the `--a8c-charts-color-axis` custom property inside the provider tree instead. See `TOKENS.md`. */
		stroke?: LineStyles[ 'stroke' ];
	};
	/** Styles for series lines */
	seriesLineStyles?: LineStyles[];
	/** Array of render functions for glyphs */
	glyphs?: Array< < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode >;
	/** Legend specific settings */
	legend?: {
		/** Styles for legend shapes */
		shapeStyles?: Record< string, unknown >[];
		/**
		 * Styles for legend labels.
		 *
		 * `color` is deprecated on its own, not the whole field: everything else a consumer sets here — font size, weight, spacing — has no catalog role behind it and still applies.
		 */
		labelStyles?: Omit< CSSProperties, 'color' > & {
			/** @deprecated Set the `--a8c-charts-color-label` custom property inside the provider tree instead. See `TOKENS.md`. */
			color?: CSSProperties[ 'color' ];
		};
		/** Styles for legend container */
		containerStyles?: CSSProperties;
	};
	/**
	 * Styles for small SVG text (eg. axis tick labels), passed through to the XYChart theme.
	 *
	 * `fontFamily: 'inherit'` is load-bearing here — it overrides the font stack `buildChartTheme` injects inline on SVG `<text>` — so only `fill` is deprecated.
	 */
	svgLabelSmall?: Omit< TextProps, 'fill' > & {
		/** @deprecated Set the `--a8c-charts-color-label-axis` custom property inside the provider tree instead, or `--a8c-charts-color-label` to move every label at once. See `TOKENS.md`. */
		fill?: TextProps[ 'fill' ];
	};
	/** Styles for large SVG text (eg. axis titles), passed through to the XYChart theme. */
	svgLabelBig?: TextProps;
	annotationStyles?: AnnotationStyles;
	/** GeoChart specific settings */
	geoChart?: {
		/**
		 * Default fill color for a geo chart feature (e.g. country) with no data.
		 *
		 * @deprecated Set the `--a8c-charts-color-surface-secondary` custom property inside the provider tree instead. Google Charts still takes a resolved hex, but the value is read from the role. See `TOKENS.md`.
		 */
		featureFillColor?: string;
	};
	/** LeaderboardChart specific settings */
	leaderboardChart?: {
		/** Gap between rows in the leaderboard grid */
		rowGap?: number;
		/** Gap between columns in the leaderboard grid */
		columnGap?: number;
		/** Spacing between label and progress bars */
		labelSpacing?: GapSize;
		/**
		 * Primary color for current period bars.
		 *
		 * @deprecated Use the `primaryColor` prop on `LeaderboardChart` for one chart, or set `--a8c-charts-color-series-1` to move the palette this falls back to. See `TOKENS.md`.
		 */
		primaryColor?: string;
		/**
		 * Secondary color for comparison period bars.
		 *
		 * @deprecated Use the `secondaryColor` prop on `LeaderboardChart` for one chart, or set `--a8c-charts-color-series-2` to move the palette this falls back to. See `TOKENS.md`.
		 */
		secondaryColor?: string;
		/**
		 * Delta colors: [negative, neutral, positive].
		 *
		 * @deprecated Set the `--a8c-charts-color-trend-down`, `-trend-neutral` and `-trend-up` custom properties inside the provider tree instead. See `TOKENS.md`.
		 */
		deltaColors?: [ string, string, string ];
	};
	/** ConversionFunnelChart specific settings */
	conversionFunnelChart?: {
		/**
		 * Primary color for funnel bars.
		 *
		 * @deprecated Set `--a8c-charts-color-series-1` to move the palette this falls back to. See `TOKENS.md`.
		 */
		primaryColor?: string;
		/**
		 * Background color for chart container.
		 *
		 * @deprecated Set the `--a8c-charts-color-surface-secondary` custom property inside the provider tree instead. See `TOKENS.md`.
		 */
		backgroundColor?: string;
		/**
		 * Color for positive change indicators.
		 *
		 * @deprecated Set the `--a8c-charts-color-trend-up` custom property inside the provider tree instead. See `TOKENS.md`.
		 */
		positiveChangeColor?: string;
		/**
		 * Color for negative change indicators.
		 *
		 * @deprecated Set the `--a8c-charts-color-trend-down` custom property inside the provider tree instead. See `TOKENS.md`.
		 */
		negativeChangeColor?: string;
	};
	lineChart?: {
		lineStyles?: Partial< Record< NonNullable< SeriesDataOptions[ 'type' ] >, LineStyles > >;
	};
	barChart?: {
		barStyles?: Partial< Record< NonNullable< SeriesDataOptions[ 'type' ] >, BarStyles > >;
	};
	/** Sparkline specific settings */
	sparkline?: {
		/** Margin around the sparkline chart */
		margin?: {
			top?: number;
			right?: number;
			bottom?: number;
			left?: number;
		};
		/** Stroke width for the sparkline line */
		strokeWidth?: number;
	};
	/**
	 * HeatmapChart settings. Cell gap, radius, value size and the selection ring come from
	 * WPDS tokens in CSS, so only the scale color and the compact sizing live here.
	 */
	heatmapChart?: {
		/**
		 * Color the cell scale interpolates toward at the highest value (prop > this >
		 * palette `colors[0]`), fed to CSS `color-mix`. Omit to use the palette color.
		 *
		 * @deprecated Use the `primaryColor` prop on `HeatmapChart` for one chart, or set `--a8c-charts-color-series-1` to move the palette this falls back to. See `TOKENS.md`.
		 */
		primaryColor?: string;
		/** Gap in px between cells in compact mode */
		compactCellGap?: number;
		/** Fixed square cell size in px for compact mode */
		compactCellSize?: number;
	};
};

/**
 * Theme configuration with all properties guaranteed to be defined.
 * Useful for merged themes where defaults are provided for all optional properties.
 */
export type CompleteChartTheme = Required< ChartTheme > & {
	leaderboardChart: Omit<
		Required< NonNullable< ChartTheme[ 'leaderboardChart' ] > >,
		'primaryColor' | 'secondaryColor'
	> &
		Pick< NonNullable< ChartTheme[ 'leaderboardChart' ] >, 'primaryColor' | 'secondaryColor' >;
	conversionFunnelChart: Omit<
		Required< NonNullable< ChartTheme[ 'conversionFunnelChart' ] > >,
		'primaryColor'
	> &
		Pick< NonNullable< ChartTheme[ 'conversionFunnelChart' ] >, 'primaryColor' >;
	lineChart: {
		lineStyles: Record< NonNullable< SeriesDataOptions[ 'type' ] >, LineStyles >;
	};
	barChart: {
		barStyles: Record< NonNullable< SeriesDataOptions[ 'type' ] >, BarStyles >;
	};
	legend: Required< NonNullable< ChartTheme[ 'legend' ] > >;
	sparkline: Required< NonNullable< ChartTheme[ 'sparkline' ] > > & {
		margin: Required< NonNullable< ChartTheme[ 'sparkline' ] >[ 'margin' ] >;
	};
	heatmapChart: Omit< Required< NonNullable< ChartTheme[ 'heatmapChart' ] > >, 'primaryColor' > &
		Pick< NonNullable< ChartTheme[ 'heatmapChart' ] >, 'primaryColor' >;
};

/**
 * Bucket resolution of time-series data, as known by the caller (e.g. a
 * granularity selector), for consumers that don't need to infer it.
 */
export type TickResolution = 'hour' | 'day' | 'week' | 'month' | 'year';

/**
 * The locale and time zone the time axis and the built-in tooltips render dates
 * in, set once by the host on `GlobalChartsProvider`.
 *
 * Both halves are plain strings the host resolves for itself, so a non-WordPress
 * consumer needs no WordPress package to supply them. Both are optional and
 * default to the JavaScript runtime's own — the viewer's browser locale and
 * browser time zone — which is what every version before this one used
 * unconditionally.
 *
 * `timeZone` re-dates the instants the host supplies, so a value that is really a
 * calendar day shifts under it: `new Date( '2026-08-02' )` is UTC midnight and
 * labels as Aug 1 in `America/Los_Angeles`. Supply true instants alongside a
 * `timeZone`, or set only `locale` for day-bucketed data. `HeatmapChart`'s
 * calendar labels take neither — see `buildCalendarHeatmapData`.
 */
export type ChartFormatting = {
	/** BCP-47 language tag, e.g. `de-DE`. Defaults to the runtime's locale. */
	locale?: string;
	/** IANA time zone name, e.g. `Asia/Tokyo`. Defaults to the runtime's zone. */
	timeZone?: string;
};

export type AxisOptions = {
	orientation?: OrientationType;
	numTicks?: number;
	/**
	 * Explicit tick values for the axis. When set, takes precedence over `numTicks`
	 * so callers can force a specific axis (e.g. integer-only steps on a sparse chart).
	 */
	tickValues?: ScaleInput< AxisScale >[];
	axisClassName?: string;
	axisLineClassName?: string;
	labelClassName?: string;
	tickClassName?: string;
	tickFormat?: TickFormatter< ScaleInput< AxisScale > >;
	/**
	 * Bucket resolution of the data, set on whichever axis carries the dates.
	 * When set, the automatic tick formatter derives tick formats from it
	 * directly instead of inferring the resolution from point spacing. For
	 * daily-or-finer buckets the overall time span still constrains the choice —
	 * e.g. hourly buckets spanning more than a week get date ticks, since hour
	 * ticks would be unreadable at that span. Ignored when `tickFormat` is set.
	 */
	tickResolution?: TickResolution;
	/**
	 * Whether to display this axis. Defaults to true.
	 */
	display?: boolean;
	/**
	 * For more control over rendering or to add event handlers to datum, pass a function as children.
	 */
	children?: ( renderProps: AxisRendererProps< AxisScale > ) => ReactNode;
	/**
	 * Controls tick label overflow (bar charts only):
	 *
	 * - 'ellipsis': Truncate with ellipsis and fit to available space. Labels show full text
	 * on hover via native tooltip. Note: A minimum width (20px) is enforced for readability.
	 * On very dense charts (bandwidth < 20px), adjacent labels may overlap. To mitigate, use `numTicks`
	 * to reduce labels or `tickFormat` to abbreviate text.
	 * - undefined: No truncation; labels may overlap.
	 *
	 * Default: No truncation; labels may overlap.
	 */
	labelOverflow?: 'ellipsis';
};

export type ScaleOptions = {
	type?: ScaleType;
	zero?: boolean;
	/**
	 * Extends the scale's domain to nice round values. Pass `false` together with
	 * an explicit `domain` to keep the tick values you set exactly.
	 */
	nice?: boolean;
	domain?: [ number, number ] | [ Date, Date ];
	range?: [ number, number ];
	/**
	 * For band scale, shortcut for setting `paddingInner` and `paddingOuter` to the same value.
	 *
	 * For point scale, the outer padding (spacing) at the ends of the range.
	 * This is similar to band scale's `paddingOuter`.
	 *
	 */
	padding?: number;
	/**
	 * The inner padding (spacing) within each band step of band scales, as a fraction of the step size. This value must lie in the range [0,1].
	 *
	 */
	paddingInner?: number;
	/**
	 * The outer padding (spacing) at the ends of the range of band and point scales,
	 * as a fraction of the step size. This value must lie in the range [0,1].
	 *
	 */
	paddingOuter?: number;
};

export type LegendItemStyles = {
	/** Margin around each legend item. */
	margin?: CSSProperties[ 'margin' ];
	/** Flex direction for items within each legend entry. */
	flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
};

export type LegendLabelStyles = Pick< CSSProperties, 'justifyContent' | 'flex' | 'margin' > & {
	/**
	 * Maximum width for legend label text as a CSS value (e.g. '200px', '50%', '10rem').
	 * When set, text overflow behavior is controlled by textOverflow.
	 */
	maxWidth?: string;
	/**
	 * Controls how text behaves when it exceeds maxWidth.
	 * - 'ellipsis': Truncate with ellipsis (ideal for widgets/small devices)
	 * - 'wrap': Wrap text to multiple lines (default, ideal for larger displays)
	 */
	textOverflow?: 'ellipsis' | 'wrap';
};

export type LegendShapeStyles = {
	/** Width of the legend shape in pixels. */
	width?: number;
	/** Height of the legend shape in pixels. */
	height?: number;
	/** Margin around the legend shape. */
	margin?: CSSProperties[ 'margin' ];
};

/** Position of the legend relative to chart content. */
export type LegendPosition = 'top' | 'bottom';

/**
 * Configuration object for chart legend appearance and behavior.
 * Consolidates all legend styling and layout props into a single structured object.
 */
export type ChartLegendConfig< T = DataPoint | DataPointDate | LeaderboardEntry > = {
	/**
	 * Layout direction of legend items.
	 */
	orientation?: 'horizontal' | 'vertical';
	/**
	 * Position of the legend relative to the chart.
	 * TODO: Add 'left' | 'right' positioning support in future implementation
	 */
	position?: LegendPosition;
	/**
	 * Alignment of the legend within its position.
	 */
	alignment?: 'start' | 'center' | 'end';
	/**
	 * Shape of the legend marker icon.
	 */
	shape?: LegendShape< T, number >;
	/**
	 * Enable interactive legend items that can toggle series visibility.
	 * Supported for all chart types that render series.
	 * Requires chartId and GlobalChartsProvider.
	 * For pie charts, percentages are recalculated so visible segments total 100%.
	 */
	interactive?: boolean;
	/**
	 * Additional CSS class name for individual legend items.
	 */
	itemClassName?: string;
	/**
	 * CSS styles for each legend item (margin, flexDirection).
	 */
	itemStyles?: LegendItemStyles;
	/**
	 * CSS styles for legend labels (maxWidth, textOverflow, justifyContent, flex, margin).
	 */
	labelStyles?: LegendLabelStyles;
	/**
	 * Styles for legend shapes (width, height, margin).
	 */
	shapeStyles?: LegendShapeStyles;
};

/**
 * Legend config for charts built from `SeriesData` (line, bar, area). Adds `collapseGroups` on top
 * of the shared config. It is intentionally absent from the base `ChartLegendConfig` so point-based
 * charts (pie, semi-circle pie) — whose data points carry `group` only to coordinate colors — can't
 * set it.
 */
export type SeriesChartLegendConfig = ChartLegendConfig< SeriesData[] > & {
	/**
	 * Collapse series that share a `group` into a single legend item, labelled by the group's
	 * primary series (its first non-comparison member). Off by default, so every series keeps its
	 * own item. Combines with `interactive`: a collapsed item toggles every series in its group, an
	 * uncollapsed one toggles only its own.
	 */
	collapseGroups?: boolean;
};

/**
 * Initial visibility options for charts built from labelled series.
 */
export interface SeriesVisibilityProps {
	/**
	 * Series labels to hide from the first defined value. User changes persist until
	 * the chart remounts or its ID changes; later values for the same ID are ignored.
	 * Omit to retain the provider's existing visibility for the chart ID.
	 */
	defaultHiddenSeries?: readonly string[];
}

/**
 * Base properties shared across all chart components
 */
export type BaseChartProps< T = DataPoint | DataPointDate | LeaderboardEntry > = {
	/**
	 * Array of data points to display in the chart
	 */
	data: T extends DataPoint | DataPointDate | LeaderboardEntry ? T[] : T;
	/**
	 * Optional unique identifier for the chart (auto-generated if not provided)
	 */
	chartId?: string;
	/**
	 * Additional CSS class name for the chart container
	 */
	className?: string;
	/**
	 * Width of the chart container in pixels. When omitted, the chart fills its parent's width.
	 */
	width?: number;
	/**
	 * Height of the chart container in pixels. When omitted, the chart fills its parent's height.
	 */
	height?: number;
	/**
	 * Maximum diameter of the pie in pixels (pie and donut charts only).
	 * The pie will shrink if the container is smaller than this value.
	 * When omitted, the pie fills the available space.
	 */
	size?: number;
	/**
	 * Chart margins
	 */
	margin?: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
	/**
	 * Callback function for pointer down event
	 */
	onPointerDown?: ( event: EventHandlerParams< DataPoint | DataPointDate > ) => void;
	/**
	 * Callback function for pointer up event
	 */
	onPointerUp?: ( event: EventHandlerParams< DataPoint | DataPointDate > ) => void;
	/**
	 * Callback function for pointer move event
	 */
	onPointerMove?: ( event: EventHandlerParams< DataPoint | DataPointDate > ) => void;
	/**
	 * Callback function for pointer out event
	 */
	onPointerOut?: ( event: PointerEvent< Element > ) => void;
	/**
	 * Callback for Enter or Space on the point keyboard navigation has selected:
	 * the keyboard counterpart of a click. `index` is the point's position in its
	 * series and `key` the series label.
	 */
	onDatumActivate?: ( params: {
		datum: DataPoint | DataPointDate;
		index: number;
		key: string;
	} ) => void;
	/**
	 * Whether to show tooltips on hover. False by default.
	 */
	withTooltips?: boolean;
	/**
	 * Whether to show legend
	 */
	showLegend?: boolean;
	/**
	 * Legend configuration object for controlling legend appearance and behavior.
	 * Includes orientation, position, alignment, shape, styling, and interactivity options.
	 */
	legend?: ChartLegendConfig< T >;
	/**
	 * Grid visibility. x is default when orientation is vertical. y is default when orientation is horizontal.
	 */
	gridVisibility?: 'x' | 'y' | 'xy' | 'none';
	/**
	 * Whether to show chart animation on initial render or not
	 */
	animation?: boolean;

	/**
	 * Gap between chart elements (SVG, legend, children).
	 * Uses WordPress design system tokens.
	 * @default 'md'
	 */
	gap?: GapSize;

	/**
	 * More options for the chart.
	 */
	options?: {
		yScale?: ScaleOptions;
		xScale?: ScaleOptions;
		axis?: {
			x?: AxisOptions;
			y?: AxisOptions;
		};
	};
};

/**
 * Local type definitions for Popover API attributes and events
 * These are used to avoid extending React module types while still getting type safety
 * NOTE: These type definitions are only needed for React 18 and below.
 * React 19+ includes Popover API types in the official React type definitions, so these can be removed when upgrading.
 */
export interface PopoverButtonAttributes {
	popovertarget?: string;
	popovertargetaction?: 'hide' | 'show' | 'toggle';
}

export interface PopoverElementAttributes {
	popover?: 'auto' | 'manual' | '';
}

// Combined types for spreading into JSX elements
export type ButtonWithPopover = PopoverButtonAttributes;
export type PopoverElement = PopoverElementAttributes;

// ToggleEvent for native Popover API
export interface ToggleEvent extends Event {
	newState: 'open' | 'closed';
	oldState: 'open' | 'closed';
}
